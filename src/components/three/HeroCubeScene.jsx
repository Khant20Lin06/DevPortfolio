import SymbolIcon from "@/components/ui/SymbolIcon";

export default function HeroCubeScene() {
  return (
    <div className="scene-3d">
      <div className="cube-container">
        <div className="cube">
          <div className="face front">
            <SymbolIcon name="code" className="hero-symbol" />
          </div>
          <div className="face back" />
          <div className="face right" />
          <div className="face left" />
          <div className="face top" />
          <div className="face bottom" />
        </div>

        <div className="orbit-ring orbit-ring-primary" />
        <div className="orbit-ring orbit-ring-secondary" />
        <div className="orbit-ring orbit-ring-tilted" />

        <div className="floating-chip chip-top">
          <SymbolIcon name="javascript" className="hero-symbol chip-primary" />
        </div>
        <div className="floating-chip chip-bottom">
          <SymbolIcon name="database" className="hero-symbol chip-secondary" />
        </div>
        <div className="floating-chip chip-left">
          <SymbolIcon name="cloud" className="hero-symbol chip-neutral" />
        </div>
      </div>
    </div>
  );
}
