export default function Home() {
  return (
    <div className="w-screen h-screen flex justify-center items-center bg-gray-50">
      <div className="max-w-2xl p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-indigo-600 mb-4">
          Welcome to Harper
        </h1>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Your ProteHome Project Assistant
        </h2>
        <p className="text-gray-600 mb-4">
          Created by <a className="text-blue-600 hover:underline" href="https://dahaotang.com">Dahao Tang</a> for internal control of the ProteHome project at
          Charles Perkins Centre, USYD.
        </p>
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="text-lg font-semibold mb-2">Capabilities:</h3>
          <ul className="list-disc pl-5 text-gray-700">
            <li>General conversational assistant</li>
            <li>Linear task management (create, find, update, delete cards)</li>
            <li>Project information retrieval</li>
            <li>GitHub integration (coming soon)</li>
          </ul>
        </div>
        <div className="mt-6 text-sm text-gray-500">
          Need help? Try saying &quot;Hello&quot; to Harper in Slack to get started.
        </div>
      </div>
    </div>
  );
}
