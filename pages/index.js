import { CopyComponent, DownloadComponent } from '@/components/upscale/ButtonComponents'
import { ModalComponent, UploadButtonComponent } from '@/components/upscale/ModalComponent'
import { Sidebar, UpscaleFactorComponent } from '@/components/upscale/SidebarComponent'
import { useAppStateStore, useImageStore } from '@/services/useState'

import { BackgroundImage } from '@/components/upscale/SVGComponents'
import Error from '@/components/upscale/ErrorComponent'
import Feedback from '@/components/upscale/FeedbackModal'
import ImageDisplay from '@/components/upscale/ImageDisplayComponent'
import NavbarComponent from '@/components/upscale/NavbarComponent'
import RunComponent from '@/components/upscale/RunComponent'
import WaifuProgressComponent from '@/components/upscale/WaifuProgComponent'
import { useEffect } from 'react'
import { useWindowSize } from '@/services/windowUtilities'
import Layout from '@/components/layout'

export default function Main() {
  const size = useWindowSize()
  const setMobile = useAppStateStore((state) => state.setMobile)

  useEffect(() => {
    setMobile(size.width / size.height < 1.0)
  }, [size])

  return (
    <Layout>
      <MobileLayout />
      <DesktopLayout />
    </Layout>
  )
}

function MobileLayout() {
  const outputURI = useImageStore((state) => state.outputURI)
  const mobile = useAppStateStore((state) => state.mobile)

  if (!mobile) {
    return null
  }

  return (
    <div className="h-fit md:hidden">
      <NavbarComponent currentPage="index" />
      <div className="grid grid-flow-col gap-1 ml-1 mr-1 justify-center mb-2"></div>
      <WaifuProgressComponent />
      <div className="mb-2">
        <ImageDisplay />
      </div>
      {outputURI != null ? (
        <div className="grid grid-flow-col gap-1 ml-1 mr-1 justify-center">
          <UploadButtonComponent />
          <DownloadComponent />
          <CopyComponent />
        </div>
      ) : (
        <div className="grid grid-flow-col gap-1 ml-1 mr-1 justify-center">
          <RunComponent />
          <UpscaleFactorComponent />
        </div>
      )}
    </div>
  )
}

function DesktopLayout() {
  const mobile = useAppStateStore((state) => state.mobile)

  if (mobile) {
    return null
  }

  return (
    <div className="overflow-hidden hidden md:block min-h-screen">
      <Error />
      <Feedback />
      <main className="flex-1">
        <ModalComponent />
        <Sidebar />
        <div className="h-3/4 grow w-full">
          <ImageDisplay />
          <WaifuProgressComponent />
        </div>
      </main>
    </div>
  )
}
