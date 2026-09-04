import { BoardPage } from './BoardPage'
import { useNotices } from '../../data/hooks'

export default function NoticePage() {
  const notices = useNotices()
  return <BoardPage posts={notices} kind="notice" types={['General', 'System']} />
}
