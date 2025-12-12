import { ClientCounter } from './components/ClientCounter';
import { ServerData } from './components/ServerData';

export default function Home() {
  return (
    <main>
      <h1>Next.js Sample for ODAVL Testing</h1>
      <ServerData />
      <ClientCounter />
    </main>
  );
}
