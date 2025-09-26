import { Header } from '../../components/Header';
import { SwapCard } from '../../components/SwapCard';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0f14] to-[#030712]">
      <Header />
      
      <main className="flex items-center justify-center min-h-[calc(100vh-140px)] px-4 pt-8">
        <SwapCard />
      </main>
      
      <footer className="fixed bottom-0 left-0 right-0 flex items-center justify-between px-6 py-4">
        <div className="text-sm text-gray-400">
          © 2025 1inch
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-400">#23448194</span>
        </div>
      </footer>
    </div>
  );
}
