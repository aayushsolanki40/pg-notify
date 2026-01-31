import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const setupDatabase = async () => {
    const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'pg_notify_demo',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
    });

    try {
        console.log('🔧 Setting up database...\n');

        // Create example tables
        await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        channel VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Created messages table');

        await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        user_name VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        room VARCHAR(100) DEFAULT 'general',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Created chat_messages table');

        await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(100) UNIQUE NOT NULL,
        customer_id VARCHAR(100),
        status VARCHAR(50) NOT NULL,
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Created orders table');

        // Create trigger function for chat notifications
        await pool.query(`
      CREATE OR REPLACE FUNCTION notify_chat_message()
      RETURNS TRIGGER AS $$
      BEGIN
        PERFORM pg_notify(
          'chat',
          json_build_object(
            'id', NEW.id,
            'user', NEW.user_name,
            'message', NEW.message,
            'room', NEW.room,
            'timestamp', NEW.created_at
          )::text
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
        console.log('✅ Created notify_chat_message function');

        await pool.query(`
      DROP TRIGGER IF EXISTS chat_message_trigger ON chat_messages;
      CREATE TRIGGER chat_message_trigger
      AFTER INSERT ON chat_messages
      FOR EACH ROW
      EXECUTE FUNCTION notify_chat_message();
    `);
        console.log('✅ Created chat_message_trigger');

        // Create trigger function for order notifications
        await pool.query(`
      CREATE OR REPLACE FUNCTION notify_order_update()
      RETURNS TRIGGER AS $$
      BEGIN
        PERFORM pg_notify(
          'orders',
          json_build_object(
            'id', NEW.id,
            'orderId', NEW.order_id,
            'customerId', NEW.customer_id,
            'status', NEW.status,
            'details', NEW.details,
            'timestamp', NEW.updated_at
          )::text
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
        console.log('✅ Created notify_order_update function');

        await pool.query(`
      DROP TRIGGER IF EXISTS order_update_trigger ON orders;
      CREATE TRIGGER order_update_trigger
      AFTER INSERT OR UPDATE ON orders
      FOR EACH ROW
      EXECUTE FUNCTION notify_order_update();
    `);
        console.log('✅ Created order_update_trigger');

        // Insert sample data
        await pool.query(`
      INSERT INTO chat_messages (user_name, message, room)
      VALUES 
        ('Alice', 'Hello everyone!', 'general'),
        ('Bob', 'Hi Alice!', 'general')
      ON CONFLICT DO NOTHING;
    `);
        console.log('✅ Inserted sample chat messages');

        await pool.query(`
      INSERT INTO orders (order_id, customer_id, status, details)
      VALUES 
        ('ORD-001', 'CUST-123', 'pending', '{"items": ["item1", "item2"], "total": 99.99}'),
        ('ORD-002', 'CUST-456', 'processing', '{"items": ["item3"], "total": 49.99}')
      ON CONFLICT (order_id) DO NOTHING;
    `);
        console.log('✅ Inserted sample orders');

        console.log('\n🎉 Database setup completed successfully!\n');
    } catch (error) {
        console.error('❌ Error setting up database:', error);
        throw error;
    } finally {
        await pool.end();
    }
};

setupDatabase().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
