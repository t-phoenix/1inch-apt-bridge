interface TokenIconProps {
  symbol: string;
  size?: "sm" | "md" | "lg";
}

const TokenIcon = ({ symbol, size = "md" }: TokenIconProps) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  // Use SVGs for POL and APT
  if (symbol.toUpperCase() === "POL") {
    return (
      <img src="/polygon.svg" alt="Polygon" className={`${sizeClasses[size]} rounded-full`} />
    );
  }
  if (symbol.toUpperCase() === "APT") {
    return (
      <img src="/aptos.svg" alt="Aptos" className={`${sizeClasses[size]} rounded-full`} />
    );
  }

  // Fallback to colored initials for other tokens
  const getTokenColor = (symbol: string) => {
    switch (symbol.toUpperCase()) {
      case "ETH":
        return "bg-gradient-to-br from-blue-400 to-blue-600";
      case "USDC":
        return "bg-gradient-to-br from-blue-500 to-blue-700";
      case "USDT":
        return "bg-gradient-to-br from-green-400 to-green-600";
      default:
        return "bg-gradient-to-br from-gray-400 to-gray-600";
    }
  };

  const getTokenInitial = (symbol: string) => {
    switch (symbol.toUpperCase()) {
      case "ETH":
        return "Ξ";
      case "USDC":
        return "C";
      case "USDT":
        return "T";
      default:
        return symbol.charAt(0);
    }
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full ${getTokenColor(symbol)} flex items-center justify-center text-white font-bold`}>
      {getTokenInitial(symbol)}
    </div>
  );
};

export default TokenIcon;