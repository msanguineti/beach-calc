import { ClientOnly } from './ClientOnly'
import Tabs from './Tabs'
import BG from './assets/images/bg-alassio.avif'
export default function Home() {
  return (
    <div
      style={{ backgroundImage: `url(${BG.src})` }}
      className="flex min-h-screen flex-col gap-16 bg-cover bg-center bg-no-repeat"
    >
      <div className="flex w-full flex-col items-center justify-center bg-gradient-to-b from-coffee p-4">
        <span className="text-center text-2xl font-bold text-white">
          &mdash;&nbsp;&nbsp;ALASSIO&nbsp;&nbsp;&mdash;
        </span>

        <h1 className="text-center text-6xl font-bold text-white">
          BAGNI MIRAMARE
        </h1>
      </div>

      <div className="mx-auto w-full max-w-screen-lg flex-grow px-4 lg:px-0">
        <div className=" rounded-lg bg-ecru-800/90 px-2 pt-1 shadow-md shadow-coffee">
          <ClientOnly>
            <Tabs />
          </ClientOnly>
        </div>
      </div>
      <div className="p-4 text-right text-xs text-white">
        <p>Made with ❤️ by GocciaSoft</p>
      </div>
    </div>
  )
}
