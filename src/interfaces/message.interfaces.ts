export interface Conversation {
    conversation_id: string;
    job_id: string;
    employer_id: string;
    student_id: string;
    created_at: Date;
    updated_at: Date;
    last_message_at?: Date;
}

export interface Message {
    message_id: string;
    conversation_id: string;
    sender_id: string;
    receiver_id: string;
    content?: string | null;
    read_status: boolean;
    file_url?: string | null;
    file_name?: string | null;
    file_type?: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface CreateConversationDto {
    job_id: string;
    employer_id: string;
    student_id: string;
}

export interface CreateMessageDto {
    conversation_id: string;
    sender_id: string;
    content: string;
    file_url?: string;
    file_name?: string;
    file_type?: string;
}

export interface MessageResponse extends Message {
    sender?: {
        user_id: string;
        full_name: string;
        profile_image_url?: string;
    };
}

export interface ConversationResponse extends Conversation {
    employerName?: string;
    studentName?: string;
    jobTitle?: string;
    lastMessage?: MessageResponse;
    unreadCount?: number;
}
