// Implements: MVP-09
// GET /functions/v1/ai-jobs/:id — yalnız çağıranın kendi job'ı.

import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'GET') return jsonResponse({ error: 'method_not_allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (authHeader === null) return jsonResponse({ error: 'unauthorized' }, 401);

  const pathSegments = new URL(req.url).pathname.split('/').filter(Boolean);
  const jobId = pathSegments.at(-1);
  if (jobId === undefined || !UUID_PATTERN.test(jobId)) {
    return jsonResponse({ error: 'invalid_job_id' }, 400);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data, error } = await supabase.rpc('get_ai_job', { p_job_id: jobId });
  if (error !== null) return jsonResponse({ error: 'job_read_failed' }, 500);

  const job = data?.[0];
  if (job === undefined) return jsonResponse({ error: 'not_found' }, 404);

  return jsonResponse({
    ok: true,
    job: {
      jobId: job.job_id,
      status: job.status,
      result: job.result_response,
      errorCode: job.error_code,
      errorMessage: job.error_message,
      correlationId: job.correlation_id,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
    },
  }, 200);
});
