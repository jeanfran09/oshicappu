"use client";

import { useEffect, useState } from "react";

export default function DiagnosePage() {
  const [envVars, setEnvVars] = useState<{ name: string; value: string; status: string }[]>([]);

  useEffect(() => {
    const vars = [
      {
        name: "NEXT_PUBLIC_SUPABASE_URL",
        value: process.env.NEXT_PUBLIC_SUPABASE_URL || "NOT FOUND",
        status: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ OK" : "❌ MISSING",
      },
      {
        name: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
        value: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? "FOUND (HIDDEN)" : "NOT FOUND",
        status: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? "✅ OK" : "❌ MISSING",
      },
    ];
    setEnvVars(vars);
  }, []);

  return (
    <div className="p-8 font-sans">
      <h1 className="text-2xl font-bold mb-6">Supabase Connection Diagnostic</h1>
      
      <div className="space-y-4">
        {envVars.map((v) => (
          <div key={v.name} className="p-4 border rounded-lg bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="font-mono font-bold">{v.name}</span>
              <span className="font-bold">{v.status}</span>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Value: <span className="font-mono">{v.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="font-bold mb-2">Troubleshooting Steps:</h2>
        <ul className="list-disc ml-5 space-y-1 text-sm">
          <li>Check if <strong>.env.local</strong> exists in the root folder (same level as package.json).</li>
          <li>Ensure there are no spaces around the <strong>=</strong> sign in the env file.</li>
          <li>Ensure the variable names match exactly (case-sensitive).</li>
          <li><strong>IMPORTANT:</strong> You must restart your terminal and run <code>npm run dev</code> again after changing .env.local.</li>
        </ul>
      </div>
    </div>
  );
}
