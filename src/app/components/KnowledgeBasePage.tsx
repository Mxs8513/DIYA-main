import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router';
import { api, type KnowledgeDoc } from '../../lib/api';
import { ProfessorSidebar } from './ProfessorSidebar';

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase();
  const colors: Record<string, string> = { pdf: 'text-red-500', docx: 'text-blue-500', txt: 'text-gray-500', md: 'text-purple-500' };
  const labels: Record<string, string> = { pdf: 'PDF', docx: 'DOCX', txt: 'TXT', md: 'MD' };
  return (
    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${colors[ext || ''] || 'text-gray-500'} bg-gray-100`}>
      {labels[ext || ''] || ext?.toUpperCase() || 'FILE'}
    </span>
  );
}

export default function KnowledgeBasePage() {
  const { groupName } = useParams<{ groupName: string }>();
  const [groupId, setGroupId] = useState<number | null>(null);
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!groupName) return;
    api.groups.byName(groupName).then(g => {
      setGroupId(g.id);
      return api.knowledge.list(g.id);
    }).then(setDocs).catch(console.error).finally(() => setLoading(false));
  }, [groupName]);

  async function handleUpload(file: File) {
    if (!groupId) return;
    setUploading(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      const result = await api.knowledge.upload(groupId, file);
      setUploadSuccess(`"${result.filename}" processed into ${result.chunks} searchable chunks.`);
      const updated = await api.knowledge.list(groupId);
      setDocs(updated);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleDelete(filename: string) {
    if (!groupId) return;
    if (!confirm(`Delete "${filename}" and all its chunks from the knowledge base?`)) return;
    setDeleting(filename);
    try {
      await api.knowledge.delete(groupId, filename);
      setDocs(prev => prev.filter(d => d.filename !== filename));
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    } finally {
      setDeleting(null);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ProfessorSidebar activeId="knowledge" groupName={groupName} />
      <div className="flex-1 p-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Knowledge Base</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Upload course materials — lecture slides, notes, and handouts. The AI will retrieve relevant content when answering student questions.
          </p>
        </div>

        {/* How it works */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mb-8 flex gap-4">
          <div className="text-2xl">🔍</div>
          <div>
            <p className="font-medium text-indigo-900 text-sm">RAG-Powered Answers</p>
            <p className="text-indigo-700 text-sm mt-0.5">
              When a student posts a question, D.I.Y.A embeds it and searches these documents for the most relevant passages.
              Those chunks are injected into the AI prompt, grounding answers in your actual course materials with source citations.
            </p>
          </div>
        </div>

        {/* Upload zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center mb-8 transition-colors cursor-pointer ${dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.txt,.md"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-600">Processing document… this may take a moment while the embedding model loads</p>
            </div>
          ) : (
            <>
              <div className="text-3xl mb-3">📄</div>
              <p className="font-medium text-gray-700">Drop a file here or click to upload</p>
              <p className="text-sm text-gray-400 mt-1">PDF, DOCX, TXT, or Markdown — up to 20 MB</p>
            </>
          )}
        </div>

        {uploadSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg px-4 py-3 mb-6 flex items-center gap-2">
            <span>✓</span> {uploadSuccess}
          </div>
        )}
        {uploadError && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg px-4 py-3 mb-6">
            {uploadError}
          </div>
        )}

        {/* Document list */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Uploaded Documents ({docs.length})
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : docs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">📚</p>
              <p className="font-medium">No documents yet</p>
              <p className="text-sm mt-1">Upload your first course material above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {docs.map(doc => (
                <div key={doc.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between hover:border-gray-300 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileIcon name={doc.filename} />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{doc.filename}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {doc.chunks} chunk{doc.chunks !== 1 ? 's' : ''} indexed · uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.filename)}
                    disabled={deleting === doc.filename}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-4 flex-shrink-0 disabled:opacity-50"
                  >
                    {deleting === doc.filename ? 'Deleting…' : 'Remove'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {docs.length > 0 && (
          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-5">
            <p className="text-sm font-medium text-gray-700 mb-2">How answers cite your materials</p>
            <p className="text-sm text-gray-500">
              When the AI uses course content to answer a question, students will see a{' '}
              <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">
                📚 Based on course materials
              </span>{' '}
              badge with the source document name.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
