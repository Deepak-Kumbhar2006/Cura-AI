export default function Assistant() {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-2xl font-bold mb-2">AI Health Assistant</h2>
      <p className="text-slate-600 mb-4">Reused from your chatbot concept to provide prevention tips and outbreak explanation prompts.</p>
      <div className="space-y-2">
        <div className="p-3 rounded bg-slate-100">💡 Prompt: "What are prevention tips for fever outbreaks in humid zones?"</div>
        <div className="p-3 rounded bg-slate-100">💡 Prompt: "Explain why cough + humidity can raise regional outbreak risk."</div>
      </div>
    </div>
  );
}
