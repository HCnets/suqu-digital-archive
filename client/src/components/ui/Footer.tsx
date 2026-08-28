/**
 * 通用页脚：全屏地图应用下的轻量信息条。
 * pointer-events-none 避免遮挡地图交互；小字低调呈现版权与审核说明。
 */
export const Footer: React.FC = () => {
  const year = new Date().getFullYear()
  return (
    <footer className="pointer-events-none select-none">
      <div className="absolute bottom-2 left-4 z-30 text-[10px] text-party-ink-light/70 whitespace-nowrap leading-none">
        苏区镇红色阵地数字化档案 · © {year} · 内容经后台审核发布
      </div>
    </footer>
  )
}
