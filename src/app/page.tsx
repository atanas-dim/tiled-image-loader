import TiledImageLoader from "@/components/tiledImageLoader/TiledImageLoader";

export default function Home() {
  return (
    <main className="w-dvw h-svh bg-[#f1dec2]">
      <TiledImageLoader tiledImagePath="/images" cols={18} rows={12} />
    </main>
  );
}
