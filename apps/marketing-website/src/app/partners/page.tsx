export default function PartnersPage() {
  const partners = [
    {
      name: 'Acme Corporation',
      testimonial: 'ODAVL reduced our code review time by 40% in the first month.',
      author: 'Jane Smith',
      role: 'VP Engineering',
      logo: '🏢'
    },
    {
      name: 'Beta Inc',
      testimonial: 'Eliminated 12,000 lines of technical debt automatically.',
      author: 'John Doe',
      role: 'CTO',
      logo: '🚀'
    },
    {
      name: 'Gamma LLC',
      testimonial: 'Three months without a production bug from code quality issues.',
      author: 'Sarah Johnson',
      role: 'Tech Lead',
      logo: '💡'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Our Partners</h1>
          <p className="text-xl text-gray-600">Trusted by development teams worldwide</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {partners.map((partner) => (
            <div key={partner.name} className="bg-white rounded-lg shadow p-8">
              <div className="text-5xl mb-4">{partner.logo}</div>
              <h3 className="text-xl font-bold mb-3">{partner.name}</h3>
              <p className="text-gray-700 mb-4 italic">"{partner.testimonial}"</p>
              <div className="border-t pt-4">
                <div className="font-semibold">{partner.author}</div>
                <div className="text-sm text-gray-500">{partner.role}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Become a Partner</h2>
          <button className="px-8 py-3 bg-brand-blue text-white rounded-lg font-semibold hover:bg-brand-blue/90">
            Contact Us
          </button>
        </div>
      </div>
    </div>
  );
}
