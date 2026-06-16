import { DB } from "@/database";
import { CustomError } from "@/utils/custom-error";
import { StatusCodes } from "http-status-codes";
import repo from "./task.repo";
import { TaskStatus } from "@/interfaces/task.interfaces";
import { getTrustScoreService } from "@/modules/trustScore/trustScore.service";
import { sendTaskAssignedEmail } from "@/services/email/email.service";
import { FRONTEND_URL } from "@/config";
import logger from "@/utils/logger";
import { checkAndAwardPioneerBadge } from "@/modules/badge/badge.service";

const EMPLOYER_ROLE_TYPES = new Set(["employer", "superAdmin"]);
const EMPLOYER_ROLE_NAMES = new Set(["employer", "superadmin"]);

const STUDENT_ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  NOT_STARTED: ["IN_PROGRESS"],
  IN_PROGRESS: ["SUBMITTED", "COMPLETED", "DISPUTED"],
  SUBMITTED: ["COMPLETED", "DISPUTED"],
  UNDER_REVIEW: ["DISPUTED"],
  COMPLETED: [],
  REJECTED: ["IN_PROGRESS", "DISPUTED"],
  DISPUTED: [],
};

const EMPLOYER_ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  NOT_STARTED: [],
  IN_PROGRESS: ["DISPUTED"],
  SUBMITTED: ["UNDER_REVIEW", "DISPUTED"],
  UNDER_REVIEW: ["COMPLETED", "REJECTED", "DISPUTED"],
  COMPLETED: [],
  REJECTED: ["UNDER_REVIEW"],
  DISPUTED: [],
};

const toMoneyNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const toDeadlineDate = (value: string | Date | null | undefined): Date | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new CustomError("Deadline must be a valid date", StatusCodes.BAD_REQUEST);
  }
  return parsed;
};

const getUserWithRole = async (user_id: string) => {
  const user = await DB.Users.findOne({
    where: { user_id },
    include: [
      {
        model: DB.Roles,
        as: "role",
        attributes: ["roleType", "roleName"],
      },
    ],
  });

  if (!user || !user.role) {
    throw new CustomError("User not found", StatusCodes.NOT_FOUND);
  }

  return user;
};

const getRoleDetails = (user: Awaited<ReturnType<typeof getUserWithRole>>) => {
  const role = user.role!;
  return {
    roleType: role.roleType,
    roleName: role.roleName.toLowerCase(),
  };
};

const ensureEmployerAccessToJob = async (job_id: string, user_id: string) => {
  const job = await DB.Jobs.findOne({ where: { job_id } });
  if (!job) {
    throw new CustomError("Job not found", StatusCodes.NOT_FOUND);
  }

  const user = await getUserWithRole(user_id);
  const { roleType, roleName } = getRoleDetails(user);

  if (
    !EMPLOYER_ROLE_TYPES.has(roleType) &&
    !EMPLOYER_ROLE_NAMES.has(roleName)
  ) {
    throw new CustomError(
      "Only employer and superadmin users can manage tasks",
      StatusCodes.FORBIDDEN,
    );
  }

  if (roleType === "employer" && job.employer_id !== user_id) {
    throw new CustomError(
      "You can only manage tasks for your own jobs",
      StatusCodes.FORBIDDEN,
    );
  }

  return { job, user };
};

const ensureApprovedAssignment = async (job_id: string, student_id: string) => {
  const approvedApplication = await repo.findApprovedApplicationForJobAndStudent(
    job_id,
    student_id,
  );

  if (!approvedApplication) {
    throw new CustomError(
      "Tasks can only be assigned to students approved for this job",
      StatusCodes.BAD_REQUEST,
    );
  }

  return approvedApplication;
};

const serializeTask = (task: any) => {
  if (!task) return task;
  const plain = typeof task.get === "function" ? task.get({ plain: true }) : task;
  const status = String(plain.status || "");
  const fundingStatus = plain.job?.funding_status ?? null;
  const paymentAmount = toMoneyNumber(plain.payment_amount);

  return {
    ...plain,
    payment_amount: paymentAmount,
    payment_release_ready:
      status === "COMPLETED" &&
      plain.job?.status !== "Completed" &&
      fundingStatus !== "Paid",
    payment_release_blocked: status === "DISPUTED",
  };
};

const buildSummary = (job: any, tasks: any[], approvedStudentsCount: number) => {
  const completedTaskCount = tasks.filter((task) => task.status === "COMPLETED").length;
  const disputedTaskCount = tasks.filter((task) => task.status === "DISPUTED").length;
  const taskCount = tasks.length;

  return {
    applicant_count: Number(job.applications || 0),
    approved_students_count: approvedStudentsCount,
    task_count: taskCount,
    completed_task_count: completedTaskCount,
    disputed_task_count: disputedTaskCount,
    overall_progress:
      taskCount === 0 ? 0 : Math.round((completedTaskCount / taskCount) * 100),
  };
};

export const getEmployerTaskOverviewService = async (user_id: string) => {
  const user = await getUserWithRole(user_id);
  const { roleType, roleName } = getRoleDetails(user);

  if (
    !EMPLOYER_ROLE_TYPES.has(roleType) &&
    !EMPLOYER_ROLE_NAMES.has(roleName)
  ) {
    throw new CustomError(
      "Only employer and superadmin users can view task management",
      StatusCodes.FORBIDDEN,
    );
  }

  const jobs = await repo.findEmployerActiveJobs(user_id);

  const overview = await Promise.all(
    jobs.map(async (job: any) => {
      const [tasks, approvedApplications] = await Promise.all([
        repo.findTasksByJobId(job.job_id),
        repo.findApprovedApplicationsByJobId(job.job_id),
      ]);

      const summary = buildSummary(job, tasks, approvedApplications.length);
      const plainJob = typeof job.get === "function" ? job.get({ plain: true }) : job;

      return {
        ...plainJob,
        ...summary,
      };
    }),
  );

  return overview;
};

export const getMyAssignedTasksService = async (user_id: string) => {
  const user = await getUserWithRole(user_id);
  const { roleType } = getRoleDetails(user);
  if (roleType !== "student") {
    throw new CustomError("Only students can view assigned tasks", StatusCodes.FORBIDDEN);
  }
  const tasks = await repo.findTasksByAssignedStudentId(user_id);
  return tasks.map(serializeTask);
};

export const getJobTaskManagementService = async (job_id: string, user_id: string) => {
  const { job } = await ensureEmployerAccessToJob(job_id, user_id);

  const [tasks, approvedApplications] = await Promise.all([
    repo.findTasksByJobId(job_id),
    repo.findApprovedApplicationsByJobId(job_id),
  ]);

  const approvedStudents = await Promise.all(
    approvedApplications.map(async (application: any) => {
      const student = application.student;
      const trustScore = student?.user_id
        ? await getTrustScoreService(student.user_id)
        : null;

      return {
        application_id: application.application_id,
        student_id: application.student_id,
        status: "Approved",
        approved_at: application.reviewed_at,
        student: {
          user_id: student?.user_id,
          full_name: student?.full_name,
          email: student?.email,
          mobile_number: student?.mobile_number,
          trust_score: trustScore?.trust_score ?? null,
        },
      };
    }),
  );

  const serializedTasks = tasks.map(serializeTask);
  const plainJob = typeof job.get === "function" ? job.get({ plain: true }) : job;

  return {
    job: plainJob,
    approved_students: approvedStudents,
    tasks: serializedTasks,
    summary: buildSummary(plainJob, serializedTasks, approvedStudents.length),
  };
};

export const createTaskService = async (
  job_id: string,
  payload: {
    assigned_student_id?: string;
    title?: string;
    description?: string;
    deadline?: string | Date | null;
    payment_amount?: number | string | null;
  },
  user_id: string,
) => {
  await ensureEmployerAccessToJob(job_id, user_id);

  if (!payload.title?.trim()) {
    throw new CustomError("Task title is required", StatusCodes.BAD_REQUEST);
  }

  if (!payload.assigned_student_id) {
    throw new CustomError(
      "Each task must be assigned to an approved student",
      StatusCodes.BAD_REQUEST,
    );
  }

  await ensureApprovedAssignment(job_id, payload.assigned_student_id);

  const paymentAmount = toMoneyNumber(payload.payment_amount);
  if (payload.payment_amount !== undefined && paymentAmount === null) {
    throw new CustomError("Payment amount must be a valid number", StatusCodes.BAD_REQUEST);
  }

  const created = await repo.createTask({
    job_id,
    assigned_student_id: payload.assigned_student_id,
    title: payload.title.trim(),
    description: payload.description?.trim() || undefined,
    deadline: toDeadlineDate(payload.deadline) ?? null,
    payment_amount: paymentAmount,
  });

  const task = await repo.findTaskById(created.task_id);
  if (!task) {
    throw new CustomError("Task not found after create", StatusCodes.INTERNAL_SERVER_ERROR);
  }

  try {
    const plain = task.get({ plain: true }) as unknown as {
      title?: string;
      deadline?: Date | string | null;
      assignedStudent?: { email?: string; full_name?: string };
      job?: { job_title?: string };
    };
    const studentEmail = plain.assignedStudent?.email;
    const studentName = plain.assignedStudent?.full_name || "there";
    const jobTitle = plain.job?.job_title || "Your job";
    const base = (FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
    const taskUrl = `${base}/dashboard/tasks`;
    const rawDeadline = plain.deadline;
    let resolvedDeadline: Date | null = null;
    if (rawDeadline != null) {
      const d =
        rawDeadline instanceof Date
          ? rawDeadline
          : new Date(String(rawDeadline));
      resolvedDeadline = Number.isNaN(d.getTime()) ? null : d;
    }
    if (studentEmail) {
      await sendTaskAssignedEmail(studentEmail, {
        studentName,
        jobTitle,
        taskTitle: String(plain.title || payload.title || "").trim() || "New task",
        taskDeadline: resolvedDeadline,
        taskUrl,
      });
    }
  } catch (err: unknown) {
    logger.error("Failed to send task assigned email", {
      taskId: created.task_id,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return serializeTask(task);
};

export const updateTaskService = async (
  job_id: string,
  task_id: string,
  payload: {
    assigned_student_id?: string;
    title?: string;
    description?: string;
    deadline?: string | Date | null;
    payment_amount?: number | string | null;
  },
  user_id: string,
) => {
  await ensureEmployerAccessToJob(job_id, user_id);
  const task = await repo.findTaskById(task_id);

  if (!task || task.job_id !== job_id) {
    throw new CustomError("Task not found", StatusCodes.NOT_FOUND);
  }

  const updates: Record<string, unknown> = {};

  if (payload.title !== undefined) {
    const title = payload.title.trim();
    if (!title) {
      throw new CustomError("Task title is required", StatusCodes.BAD_REQUEST);
    }
    updates.title = title;
  }

  if (payload.description !== undefined) {
    updates.description = payload.description?.trim() || null;
  }

  if (payload.deadline !== undefined) {
    updates.deadline = toDeadlineDate(payload.deadline) ?? null;
  }

  if (payload.payment_amount !== undefined) {
    const paymentAmount = toMoneyNumber(payload.payment_amount);
    if (payload.payment_amount !== null && paymentAmount === null) {
      throw new CustomError("Payment amount must be a valid number", StatusCodes.BAD_REQUEST);
    }
    updates.payment_amount = paymentAmount;
  }

  if (payload.assigned_student_id !== undefined) {
    await ensureApprovedAssignment(job_id, payload.assigned_student_id);
    updates.assigned_student_id = payload.assigned_student_id;
  }

  const updated = await repo.updateTask(task_id, updates);
  return serializeTask(updated);
};

export const updateTaskStatusService = async (
  job_id: string,
  task_id: string,
  nextStatus: TaskStatus,
  user_id: string,
) => {
  const task = await repo.findTaskById(task_id);
  if (!task || task.job_id !== job_id) {
    throw new CustomError("Task not found", StatusCodes.NOT_FOUND);
  }

  const user = await getUserWithRole(user_id);
  const { roleType, roleName } = getRoleDetails(user);

  const isEmployerActor =
    EMPLOYER_ROLE_TYPES.has(roleType) || EMPLOYER_ROLE_NAMES.has(roleName);
  const isStudentActor = roleType === "student";

  if (isEmployerActor) {
    await ensureEmployerAccessToJob(job_id, user_id);
  } else if (isStudentActor) {
    if (task.assigned_student_id !== user_id) {
      throw new CustomError(
        "Students can only update tasks assigned to them",
        StatusCodes.FORBIDDEN,
      );
    }
  } else {
    throw new CustomError("You do not have access to update this task", StatusCodes.FORBIDDEN);
  }

  const allowedTransitions = isEmployerActor
    ? EMPLOYER_ALLOWED_TRANSITIONS[task.status]
    : STUDENT_ALLOWED_TRANSITIONS[task.status];

  if (!allowedTransitions.includes(nextStatus)) {
    throw new CustomError(
      `Invalid task transition from ${task.status} to ${nextStatus}`,
      StatusCodes.BAD_REQUEST,
    );
  }

  const updated = await repo.updateTask(task_id, { status: nextStatus });

  if (nextStatus === "COMPLETED" && task.assigned_student_id) {
    checkAndAwardPioneerBadge(task.assigned_student_id).catch(() => {});
  }

  return serializeTask(updated);
};

export const deleteTaskService = async (job_id: string, task_id: string, user_id: string) => {
  await ensureEmployerAccessToJob(job_id, user_id);
  const task = await repo.findTaskById(task_id);
  if (!task || task.job_id !== job_id) {
    throw new CustomError("Task not found", StatusCodes.NOT_FOUND);
  }
  const deleted = await repo.deleteTask(task_id);
  if (!deleted) {
    throw new CustomError("Task not found", StatusCodes.NOT_FOUND);
  }
  return { task_id };
};
