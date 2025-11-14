export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    const CLIENT_ID = env.GOOGLE_CLIENT_ID;
    const CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;
    const REFRESH_TOKEN = env.GOOGLE_REFRESH_TOKEN;
    const FOLDER_ID = env.DRIVE_FOLDER_ID || '1AvpoKZzY7CVtcSBX8wA7Oq8JfAWo-oou';

    async function getAccessToken() {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          refresh_token: REFRESH_TOKEN,
          grant_type: 'refresh_token'
        })
      });
      const data = await res.json();
      return data.access_token;
    }

    const token = await getAccessToken();

    // LIST files
    if (path === '/list') {
      const folder = url.searchParams.get('folderId') || FOLDER_ID;
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folder}'+in+parents&fields=files(id,name,mimeType,size,modifiedTime)`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // DOWNLOAD by file ID
    if (path.startsWith('/download/')) {
      const fileId = path.split('/')[2];
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 404) return new Response('Not found', { status: 404 });
      const blob = await res.blob();
      const meta = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,mimeType`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json());
      return new Response(blob, {
        headers: {
          'Content-Type': meta.mimeType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${meta.name}"`,
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // UPLOAD
    if (path === '/upload' && request.method === 'POST') {
      const form = await request.formData();
      const file = form.get('file');
      const metadata = { name: `${crypto.randomUUID()}_${file.name}`, parents: [FOLDER_ID] };
      const uploadForm = new FormData();
      uploadForm.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      uploadForm.append('file', file);

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: uploadForm
      });
      const data = await res.json();
      return new Response(JSON.stringify({ file_id: data.id, filename: data.name }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // DELETE
    if (path.startsWith('/delete/') && request.method === 'DELETE') {
      const fileId = path.split('/')[2];
      await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      return new Response(JSON.stringify({ message: 'Deleted' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response('Not found', { status: 404 });
  }
};
