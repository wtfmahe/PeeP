// Supabase Edge Function to send push notification when someone is peeped
// Deploy with: supabase functions deploy send-peep-notification

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PeepPayload {
    from_user_id: string;
    to_user_id: string;
    friendly_name: string;
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const { from_user_id, to_user_id, friendly_name }: PeepPayload = await req.json();

        // Get the peeper's username
        const { data: peeper } = await supabaseClient
            .from("profiles")
            .select("username")
            .eq("id", from_user_id)
            .single();

        // Get the target's FCM token
        const { data: target } = await supabaseClient
            .from("profiles")
            .select("fcm_token")
            .eq("id", to_user_id)
            .single();

        if (!target?.fcm_token) {
            return new Response(
                JSON.stringify({ success: false, error: "No FCM token for target user" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Send push notification via Expo Push API
        // (Expo push tokens work with their push service)
        const pushResponse = await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                to: target.fcm_token,
                title: "👀 You were peeped!",
                body: `${peeper?.username || "Someone"} saw you ${friendly_name || "using your phone"}`,
                sound: "default",
                data: {
                    type: "peep",
                    from_user_id,
                },
            }),
        });

        const pushResult = await pushResponse.json();

        return new Response(
            JSON.stringify({ success: true, pushResult }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
});
