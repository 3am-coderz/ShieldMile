import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { action, payload } = await req.json();

    if (action === "login") {
      const { partner_id, password } = payload;
      
      const { data: worker, error } = await supabase
        .from("workers")
        .select("*")
        .eq("partner_id", partner_id)
        .single();

      if (error || !worker) {
        return new Response(JSON.stringify({ error: "Account not found." }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Plaintext check (can be upgraded to bcrypt later just like the admin function)
      if (worker.auth_hash !== password) {
        return new Response(JSON.stringify({ error: "Incorrect password." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch active policy if exists
      const { data: policy } = await supabase
        .from("policies")
        .select("tier")
        .eq("worker_id", worker.id)
        .eq("status", "active")
        .maybeSingle();

      return new Response(JSON.stringify({ worker, policy }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "register") {
      const { workerData, policyTier } = payload;
      
      // 1. Create Worker
      const { data: newWorker, error: workerErr } = await supabase
        .from("workers")
        .insert(workerData)
        .select()
        .single();

      if (workerErr) throw workerErr;

      // 2. Create Initial Policy
      const { data: newPolicy, error: policyErr } = await supabase
        .from("policies")
        .insert({
          worker_id: newWorker.id,
          tier: policyTier,
          premium_paid: policyTier === "Premium" ? 249 : policyTier === "Standard" ? 149 : 99,
          status: "active"
        })
        .select()
        .single();

      if (policyErr) throw policyErr;

      return new Response(JSON.stringify({ worker: newWorker, policy: newPolicy }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
