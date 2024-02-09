import { createRoot } from 'react-dom/client'
import Route from './pages'

const main = document.querySelector('main')!
createRoot(main).render(<Route />)
