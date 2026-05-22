#!/usr/bin/env node

/**
 * Script to set up Supabase storage bucket for asset logos
 * Run with: node scripts/setup-storage.js
 */

import { createClient } from '@supabase/supabase-js';

// You'll need to set these environment variables or replace with your actual values
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'your-service-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function setupStorageBucket() {
  try {
    console.log('Setting up asset-logos storage bucket...');
    
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.id === 'asset-logos');
    
    if (bucketExists) {
      console.log('✅ Bucket already exists');
      return;
    }
    
    // Create the bucket
    const { error: createError } = await supabase.storage.createBucket('asset-logos', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      fileSizeLimit: 5242880, // 5MB
    });
    
    if (createError) {
      console.error('❌ Error creating bucket:', createError);
      return;
    }
    
    console.log('✅ Successfully created asset-logos bucket');
    
    // Set up RLS policies using SQL
    const policies = [
      {
        name: 'Allow authenticated users to upload asset logos',
        sql: `
          CREATE POLICY "Allow authenticated users to upload asset logos" ON storage.objects
          FOR INSERT
          TO authenticated
          WITH CHECK (bucket_id = 'asset-logos');
        `
      },
      {
        name: 'Allow public read access to asset logos',
        sql: `
          CREATE POLICY "Allow public read access to asset logos" ON storage.objects
          FOR SELECT
          TO public
          USING (bucket_id = 'asset-logos');
        `
      },
      {
        name: 'Allow authenticated users to update asset logos',
        sql: `
          CREATE POLICY "Allow authenticated users to update asset logos" ON storage.objects
          FOR UPDATE
          TO authenticated
          USING (bucket_id = 'asset-logos');
        `
      },
      {
        name: 'Allow authenticated users to delete asset logos',
        sql: `
          CREATE POLICY "Allow authenticated users to delete asset logos" ON storage.objects
          FOR DELETE
          TO authenticated
          USING (bucket_id = 'asset-logos');
        `
      }
    ];
    
    for (const policy of policies) {
      const { error } = await supabase.rpc('sql', { query: policy.sql });
      if (error) {
        console.warn(`⚠️  Warning: Could not create policy "${policy.name}":`, error.message);
      } else {
        console.log(`✅ Created policy: ${policy.name}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

setupStorageBucket();