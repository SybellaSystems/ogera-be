export interface JobReaction {

    reaction_id: string;

    job_id: string;

    user_id: string;

    reaction_type: "like" | "dislike";

    created_at?: Date;

    updated_at?: Date;
}