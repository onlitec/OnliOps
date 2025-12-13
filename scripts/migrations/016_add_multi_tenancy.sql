-- 1. Create Clients Table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 2. Create Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- 3. Insert Default Data (to migrate existing data)
DO $$
DECLARE default_client_id UUID;
default_project_id UUID;
BEGIN -- Check if default client exists, create if not
SELECT id INTO default_client_id
FROM public.clients
WHERE name = 'Default Client'
LIMIT 1;
IF default_client_id IS NULL THEN
INSERT INTO public.clients (name)
VALUES ('Default Client')
RETURNING id INTO default_client_id;
END IF;
-- Check if default project exists, create if not
SELECT id INTO default_project_id
FROM public.projects
WHERE name = 'Default Project'
    AND client_id = default_client_id
LIMIT 1;
IF default_project_id IS NULL THEN
INSERT INTO public.projects (client_id, name, description)
VALUES (
        default_client_id,
        'Default Project',
        'Migrated existing data'
    )
RETURNING id INTO default_project_id;
END IF;
-- 4. Add project_id to existing tables if not exists
-- network_devices
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'network_devices'
        AND column_name = 'project_id'
) THEN
ALTER TABLE public.network_devices
ADD COLUMN project_id UUID REFERENCES public.projects(id);
UPDATE public.network_devices
SET project_id = default_project_id
WHERE project_id IS NULL;
END IF;
-- vlans
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'vlans'
        AND column_name = 'project_id'
) THEN
ALTER TABLE public.vlans
ADD COLUMN project_id UUID REFERENCES public.projects(id);
UPDATE public.vlans
SET project_id = default_project_id
WHERE project_id IS NULL;
END IF;
-- alerts
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'alerts'
        AND column_name = 'project_id'
) THEN
ALTER TABLE public.alerts
ADD COLUMN project_id UUID REFERENCES public.projects(id);
UPDATE public.alerts
SET project_id = default_project_id
WHERE project_id IS NULL;
END IF;
-- simulations
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'simulations'
        AND column_name = 'project_id'
) THEN
ALTER TABLE public.simulations
ADD COLUMN project_id UUID REFERENCES public.projects(id);
UPDATE public.simulations
SET project_id = default_project_id
WHERE project_id IS NULL;
END IF;
-- device_connections (Topology)
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'device_connections'
        AND column_name = 'project_id'
) THEN
ALTER TABLE public.device_connections
ADD COLUMN project_id UUID REFERENCES public.projects(id);
UPDATE public.device_connections
SET project_id = default_project_id
WHERE project_id IS NULL;
END IF;
END $$;