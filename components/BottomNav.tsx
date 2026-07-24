import { 
  Home, 
  Search, 
  Users, 
  Bell, 
  User 
} from "lucide-react";

/**
 * 
 * TODO: add filled icons and redirecing
 */

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-accent flex justify-around items-center">
      <button>
        <Home size={24} />
      </button>

      <button>
        <Search size={24} />
      </button>

      <button>
        <Users size={24} />
      </button>

      <button>
        <Bell size={24} />
      </button>

      <button>
        <User size={24} />
      </button>
    </nav>
  );
}