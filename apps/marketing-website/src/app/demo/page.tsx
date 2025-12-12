export default function DemoPage() {
  const demos = [
    { title: 'ODAVL Insight', duration: '90s', videoId: 'placeholder1' },
    { title: 'ODAVL Autopilot', duration: '120s', videoId: 'placeholder2' },
    { title: 'ODAVL Guardian', duration: '90s', videoId: 'placeholder3' },
    { title: 'Cloud Console Tour', duration: '180s', videoId: 'placeholder4' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Product Demos</h1>
          <p className="text-xl text-gray-600">See ODAVL Studio in action</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {demos.map((demo) => (
            <div key={demo.title} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="aspect-video bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">Video: {demo.title}</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{demo.title}</h3>
                <span className="text-sm text-gray-500">{demo.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
