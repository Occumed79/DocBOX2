import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const filePath = path.join(process.cwd(), 'Story', 'OccuMed_Stateside_Providers.pdf');
  const document = await readFile(filePath);

  return new Response(document, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Content-Disposition': 'attachment; filename="OccuMed_Stateside_Providers.pdf"',
      'Content-Length': String(document.byteLength),
      'Content-Type': 'application/pdf',
    },
  });
}
