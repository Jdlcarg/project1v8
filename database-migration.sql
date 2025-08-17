
-- Database Migration Script for Profile Functionality
-- Run this script in your Neon PostgreSQL database

-- =====================================================
-- 1. Add tracking number to existing orders table
-- =====================================================
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tracking_number TEXT;

-- =====================================================
-- 2. Create order_tracking table
-- =====================================================
CREATE TABLE IF NOT EXISTS order_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('processing', 'preparing', 'shipped', 'delivered')),
    description TEXT,
    location TEXT,
    estimated_delivery TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for order_tracking
CREATE INDEX IF NOT EXISTS order_tracking_order_id_idx ON order_tracking(order_id);
CREATE INDEX IF NOT EXISTS order_tracking_status_idx ON order_tracking(status);

-- =====================================================
-- 3. Create support_tickets table
-- =====================================================
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticket_number TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('order', 'product', 'complaint', 'suggestion')),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to UUID REFERENCES users(id),
    resolution TEXT,
    attachments JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP
);

-- Create indexes for support_tickets
CREATE INDEX IF NOT EXISTS support_tickets_user_id_idx ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets(status);
CREATE INDEX IF NOT EXISTS support_tickets_type_idx ON support_tickets(type);
CREATE INDEX IF NOT EXISTS support_tickets_created_at_idx ON support_tickets(created_at);

-- =====================================================
-- 4. Create support_ticket_replies table
-- =====================================================
CREATE TABLE IF NOT EXISTS support_ticket_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_from_support BOOLEAN NOT NULL DEFAULT FALSE,
    attachments JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for support_ticket_replies
CREATE INDEX IF NOT EXISTS support_ticket_replies_ticket_id_idx ON support_ticket_replies(ticket_id);

-- =====================================================
-- 5. Create user_favorites table
-- =====================================================
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Create indexes for user_favorites
CREATE INDEX IF NOT EXISTS user_favorites_user_id_idx ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS user_favorites_product_id_idx ON user_favorites(product_id);
CREATE INDEX IF NOT EXISTS user_favorites_user_product_idx ON user_favorites(user_id, product_id);

-- =====================================================
-- 6. Create user_stats table
-- =====================================================
CREATE TABLE IF NOT EXISTS user_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_spent DECIMAL(12,2) NOT NULL DEFAULT 0,
    favorite_products INTEGER NOT NULL DEFAULT 0,
    last_order_date TIMESTAMP,
    average_order_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    loyalty_points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for user_stats
CREATE INDEX IF NOT EXISTS user_stats_user_id_idx ON user_stats(user_id);

-- =====================================================
-- 7. Create password_recovery_tokens table
-- =====================================================
CREATE TABLE IF NOT EXISTS password_recovery_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for password_recovery_tokens
CREATE INDEX IF NOT EXISTS password_recovery_tokens_token_idx ON password_recovery_tokens(token);
CREATE INDEX IF NOT EXISTS password_recovery_tokens_user_id_idx ON password_recovery_tokens(user_id);
CREATE INDEX IF NOT EXISTS password_recovery_tokens_expires_at_idx ON password_recovery_tokens(expires_at);

-- =====================================================
-- 8. Create user_notification_preferences table
-- =====================================================
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    order_updates BOOLEAN NOT NULL DEFAULT TRUE,
    promotional_emails BOOLEAN NOT NULL DEFAULT TRUE,
    sms_notifications BOOLEAN NOT NULL DEFAULT FALSE,
    push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for user_notification_preferences
CREATE INDEX IF NOT EXISTS user_notification_preferences_user_id_idx ON user_notification_preferences(user_id);

-- =====================================================
-- 9. Create indexes for existing tables (performance)
-- =====================================================
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);

-- =====================================================
-- 10. Create triggers for automatic updates
-- =====================================================

-- Function to update user stats when orders change
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update user stats
    INSERT INTO user_stats (user_id, total_orders, total_spent, last_order_date, average_order_value)
    SELECT 
        o.user_id,
        COUNT(*) as total_orders,
        COALESCE(SUM(o.total), 0) as total_spent,
        MAX(o.created_at) as last_order_date,
        COALESCE(AVG(o.total), 0) as average_order_value
    FROM orders o
    WHERE o.user_id = COALESCE(NEW.user_id, OLD.user_id)
    GROUP BY o.user_id
    ON CONFLICT (user_id) 
    DO UPDATE SET
        total_orders = EXCLUDED.total_orders,
        total_spent = EXCLUDED.total_spent,
        last_order_date = EXCLUDED.last_order_date,
        average_order_value = EXCLUDED.average_order_value,
        updated_at = NOW();
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for orders
DROP TRIGGER IF EXISTS update_user_stats_trigger ON orders;
CREATE TRIGGER update_user_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats();

-- Function to update favorite products count
CREATE OR REPLACE FUNCTION update_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_stats 
    SET favorite_products = (
        SELECT COUNT(*) 
        FROM user_favorites 
        WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    ),
    updated_at = NOW()
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_favorites
DROP TRIGGER IF EXISTS update_favorite_count_trigger ON user_favorites;
CREATE TRIGGER update_favorite_count_trigger
    AFTER INSERT OR DELETE ON user_favorites
    FOR EACH ROW
    EXECUTE FUNCTION update_favorite_count();

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ticket_number = 'TKT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('ticket_sequence')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for ticket numbers
CREATE SEQUENCE IF NOT EXISTS ticket_sequence START 1;

-- Create trigger for support tickets
DROP TRIGGER IF EXISTS generate_ticket_number_trigger ON support_tickets;
CREATE TRIGGER generate_ticket_number_trigger
    BEFORE INSERT ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION generate_ticket_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_stats_updated_at ON user_stats;
CREATE TRIGGER update_user_stats_updated_at
    BEFORE UPDATE ON user_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_notification_preferences_updated_at ON user_notification_preferences;
CREATE TRIGGER update_user_notification_preferences_updated_at
    BEFORE UPDATE ON user_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 11. Insert seed data for testing
-- =====================================================

-- Create user stats for existing users
INSERT INTO user_stats (user_id, total_orders, total_spent, favorite_products, last_order_date, average_order_value)
SELECT 
    u.id,
    COALESCE(order_counts.total_orders, 0),
    COALESCE(order_counts.total_spent, 0),
    0,
    order_counts.last_order_date,
    COALESCE(order_counts.average_order_value, 0)
FROM users u
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as total_orders,
        SUM(total::DECIMAL) as total_spent,
        MAX(created_at) as last_order_date,
        AVG(total::DECIMAL) as average_order_value
    FROM orders
    GROUP BY user_id
) order_counts ON u.id = order_counts.user_id
ON CONFLICT (user_id) DO NOTHING;

-- Create notification preferences for existing users
INSERT INTO user_notification_preferences (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample order tracking data for existing orders
INSERT INTO order_tracking (order_id, status, description, created_at)
SELECT 
    id,
    CASE 
        WHEN status = 'pending' THEN 'processing'
        WHEN status = 'confirmed' THEN 'preparing'
        WHEN status = 'shipped' THEN 'shipped'
        WHEN status = 'delivered' THEN 'delivered'
        ELSE 'processing'
    END,
    CASE 
        WHEN status = 'pending' THEN 'Pedido recibido y en proceso de validación'
        WHEN status = 'confirmed' THEN 'Pedido confirmado, preparando envío'
        WHEN status = 'shipped' THEN 'Pedido enviado, en camino al destino'
        WHEN status = 'delivered' THEN 'Pedido entregado exitosamente'
        ELSE 'Procesando pedido'
    END,
    created_at
FROM orders;

-- Update orders with tracking numbers
UPDATE orders 
SET tracking_number = 'AR' || LPAD(FLOOR(RANDOM() * 999999999)::TEXT, 9, '0')
WHERE tracking_number IS NULL AND status IN ('shipped', 'delivered');

-- Insert sample support tickets
INSERT INTO support_tickets (user_id, type, subject, description, status, priority)
SELECT 
    u.id,
    (ARRAY['order', 'product', 'complaint', 'suggestion'])[FLOOR(RANDOM() * 4 + 1)],
    'Consulta de ejemplo',
    'Esta es una consulta de ejemplo para testing del sistema',
    (ARRAY['open', 'in-progress', 'resolved'])[FLOOR(RANDOM() * 3 + 1)],
    (ARRAY['low', 'medium', 'high'])[FLOOR(RANDOM() * 3 + 1)]
FROM users u
WHERE u.role = 'user'
LIMIT 3;

-- Insert sample favorites (first 2 products for each user)
INSERT INTO user_favorites (user_id, product_id)
SELECT DISTINCT
    u.id,
    p.id
FROM users u
CROSS JOIN (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
    FROM products
    WHERE is_active = true
) p
WHERE u.role = 'user' AND p.rn <= 2
ON CONFLICT (user_id, product_id) DO NOTHING;

-- =====================================================
-- 12. Create views for easy data access
-- =====================================================

-- View for orders with tracking and items
CREATE OR REPLACE VIEW orders_with_details AS
SELECT 
    o.*,
    json_agg(
        json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', p.name,
            'product_image', p.image,
            'quantity', oi.quantity,
            'price', oi.price
        )
    ) as items,
    json_agg(
        json_build_object(
            'id', ot.id,
            'status', ot.status,
            'description', ot.description,
            'location', ot.location,
            'estimated_delivery', ot.estimated_delivery,
            'created_at', ot.created_at
        ) ORDER BY ot.created_at
    ) FILTER (WHERE ot.id IS NOT NULL) as tracking
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
LEFT JOIN order_tracking ot ON o.id = ot.order_id
GROUP BY o.id;

-- View for support tickets with replies
CREATE OR REPLACE VIEW support_tickets_with_replies AS
SELECT 
    st.*,
    json_agg(
        json_build_object(
            'id', str.id,
            'user_id', str.user_id,
            'user_name', u.name,
            'message', str.message,
            'is_from_support', str.is_from_support,
            'attachments', str.attachments,
            'created_at', str.created_at
        ) ORDER BY str.created_at
    ) FILTER (WHERE str.id IS NOT NULL) as replies
FROM support_tickets st
LEFT JOIN support_ticket_replies str ON st.id = str.ticket_id
LEFT JOIN users u ON str.user_id = u.id
GROUP BY st.id;

-- View for user dashboard data
CREATE OR REPLACE VIEW user_dashboard AS
SELECT 
    u.id as user_id,
    u.name,
    u.email,
    us.total_orders,
    us.total_spent,
    us.favorite_products,
    us.last_order_date,
    us.average_order_value,
    us.loyalty_points,
    unp.email_notifications,
    unp.order_updates,
    unp.promotional_emails,
    (
        SELECT COUNT(*) 
        FROM support_tickets st 
        WHERE st.user_id = u.id AND st.status IN ('open', 'in-progress')
    ) as open_tickets,
    (
        SELECT json_agg(
            json_build_object(
                'id', p.id,
                'name', p.name,
                'price', p.price,
                'image', p.image,
                'category', p.category
            )
        )
        FROM user_favorites uf
        JOIN products p ON uf.product_id = p.id
        WHERE uf.user_id = u.id AND p.is_active = true
    ) as favorite_products_details
FROM users u
LEFT JOIN user_stats us ON u.id = us.user_id
LEFT JOIN user_notification_preferences unp ON u.id = unp.user_id
WHERE u.role = 'user';

-- =====================================================
-- Final message
-- =====================================================
SELECT 'Database migration completed successfully! All tables, indexes, triggers, and seed data have been created.' as message;
