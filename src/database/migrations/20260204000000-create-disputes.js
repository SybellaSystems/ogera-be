'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create disputes table
    await queryInterface.createTable('disputes', {
      dispute_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      job_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'jobs',
          key: 'job_id',
        },
        onDelete: 'CASCADE',
      },
      job_application_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'job_applications',
          key: 'application_id',
        },
        onDelete: 'SET NULL',
      },
      student_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id',
        },
        onDelete: 'CASCADE',
      },
      employer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id',
        },
        onDelete: 'CASCADE',
      },
      type: {
        type: Sequelize.ENUM('Payment', 'Contract Violation', 'Quality Issue', 'Timeline'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('Open', 'Under Review', 'Mediation', 'Resolved', 'Closed'),
        allowNull: false,
        defaultValue: 'Open',
      },
      priority: {
        type: Sequelize.ENUM('High', 'Medium', 'Low'),
        allowNull: false,
        defaultValue: 'Medium',
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      reported_by: {
        type: Sequelize.ENUM('student', 'employer'),
        allowNull: false,
      },
      moderator_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_id',
        },
        onDelete: 'SET NULL',
      },
      escalated_to: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_id',
        },
        onDelete: 'SET NULL',
      },
      resolution: {
        type: Sequelize.ENUM('Refunded', 'Settled', 'Dismissed', 'Escalated'),
        allowNull: true,
      },
      resolution_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      escrow_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      refund_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      fee_penalty: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
      },
      auto_escalated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      last_response_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      resolved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    // Create dispute_evidence table
    await queryInterface.createTable('dispute_evidence', {
      evidence_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      dispute_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'disputes',
          key: 'dispute_id',
        },
        onDelete: 'CASCADE',
      },
      uploaded_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id',
        },
        onDelete: 'CASCADE',
      },
      file_url: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      file_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      file_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    // Create dispute_messages table
    await queryInterface.createTable('dispute_messages', {
      message_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      dispute_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'disputes',
          key: 'dispute_id',
        },
        onDelete: 'CASCADE',
      },
      sender_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id',
        },
        onDelete: 'CASCADE',
      },
      sender_type: {
        type: Sequelize.ENUM('student', 'employer', 'moderator'),
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      is_internal: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    // Create dispute_timeline table
    await queryInterface.createTable('dispute_timeline', {
      timeline_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      dispute_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'disputes',
          key: 'dispute_id',
        },
        onDelete: 'CASCADE',
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      performed_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id',
        },
        onDelete: 'CASCADE',
      },
      performed_by_type: {
        type: Sequelize.ENUM('student', 'employer', 'moderator', 'system'),
        allowNull: false,
      },
      details: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('dispute_timeline');
    await queryInterface.dropTable('dispute_messages');
    await queryInterface.dropTable('dispute_evidence');
    await queryInterface.dropTable('disputes');
    
    // Drop ENUM types if necessary (Postgres)
    try {
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_disputes_type\";");
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_disputes_status\";");
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_disputes_priority\";");
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_disputes_reported_by\";");
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_disputes_resolution\";");
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_dispute_messages_sender_type\";");
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_dispute_timeline_performed_by_type\";");
    } catch (e) {
      // ignore
    }
  },
};




