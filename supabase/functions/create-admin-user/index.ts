
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("🔥 Edge Function called: create-admin-user");

  let body: any = {};
  try {
    body = await req.json();
    console.log("📦 Request body received:", { ...body, password: "[REDACTED]" });
  } catch (err) {
    console.error("❌ Failed to parse request body:", err);
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { email, fullName, type, password } = body;

  // Validation with detailed error messages
  if (!email) {
    console.error("❌ Validation failed: email is missing");
    return new Response(JSON.stringify({ error: "Email is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!fullName) {
    console.error("❌ Validation failed: fullName is missing");
    return new Response(JSON.stringify({ error: "Full name is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!type || !["admin", "superadmin"].includes(type)) {
    console.error("❌ Validation failed: invalid type:", type);
    return new Response(JSON.stringify({ error: "Type must be 'admin' or 'superadmin'" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    console.error("❌ Validation failed: invalid password");
    return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !serviceKey) {
    console.error("❌ Missing environment variables:", { 
      hasUrl: !!supabaseUrl, 
      hasServiceKey: !!serviceKey 
    });
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log("🔑 Creating Supabase client...");
  const supabase = createClient(supabaseUrl, serviceKey);

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");

  if (!jwt) {
    console.error("❌ Missing caller authorization");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: callerData, error: callerError } = await supabase.auth.getUser(jwt);
  const caller = callerData.user;

  if (callerError || !caller) {
    console.error("❌ Invalid caller token:", callerError);
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: callerProfile, error: callerProfileError } = await supabase
    .from("profiles")
    .select("is_superadmin")
    .eq("id", caller.id)
    .single();

  if (callerProfileError || !callerProfile?.is_superadmin) {
    console.error("❌ Caller is not a superadmin:", caller.id);
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 1. Create Auth user with password
  console.log("👤 Creating auth user for:", email);
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
  });

  if (authError || !authUser?.user?.id) {
    console.error("❌ Auth user creation failed:", authError);
    return new Response(JSON.stringify({
      error: authError?.message ?? "Failed to create auth user",
      details: authError,
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const id = authUser.user.id;
  console.log("✅ Auth user created with ID:", id);

  // 2. Insert into profiles
  console.log("📝 Creating profile for user:", id);
  const profileData = {
    id,
    email,
    full_name: fullName,
    is_admin: type === "admin" || type === "superadmin",
    is_superadmin: type === "superadmin",
  };
  console.log("📦 Profile data:", profileData);

  const { error: profileError } = await supabase.from("profiles").insert(profileData);

  if (profileError) {
    console.error("❌ Profile creation failed:", profileError);
    // Clean up - delete auth user if profile insertion fails
    console.log("🧹 Cleaning up auth user due to profile error...");
    await supabase.auth.admin.deleteUser(id);
    return new Response(JSON.stringify({
      error: profileError.message,
      details: profileError,
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log("✅ Profile created successfully");

  console.log("🎉 Admin user creation completed successfully");
  return new Response(JSON.stringify({
    message: "User created",
    user: { id, email, fullName, type },
  }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
