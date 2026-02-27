import AIChatbot from "@/components/AIChatbot"

export default function LaunchPage() {
  return (
    <div className="relative min-h-screen w-full bg-[#F4F2E6]">
      <iframe
        src="/launch/content"
        title="GoShop Launch"
        className="block min-h-screen w-full border-0"
      />
      <AIChatbot compact />
    </div>
  )
}
