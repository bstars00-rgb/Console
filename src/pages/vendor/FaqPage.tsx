import { BoardPage } from './BoardPage'
import { useFaqs } from '../../data/hooks'

export default function FaqPage() {
  const faqs = useFaqs()
  return <BoardPage posts={faqs} kind="faq" types={['Booking', 'Billing', 'Content', 'Rate']} />
}
