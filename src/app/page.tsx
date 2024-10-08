import TiledImageLoader from "@/components/tiledImageLoader/TiledImageLoader";

export default function Home() {
  return (
    <main className="p-4">
      <TiledImageLoader tiledImagePath="/images" cols={10} rows={4} />
    </main>
  );
}
