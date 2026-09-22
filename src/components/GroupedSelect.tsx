import type { TraitGroups } from '../lib/parseDisciplines'
import {
  AutocompleteSelect,
  type AutocompleteGroup,
} from './AutocompleteSelect'

type Props = {
  value: string
  onChange: (value: string) => void
  groups: TraitGroups
  emptyLabel?: string
}

const GROUP_META: {
  key: keyof TraitGroups
  label: string
  className: string
}[] = [
  {
    key: 'skills',
    label: 'Umiejętności',
    className: 'autocomplete__group-label--skills',
  },
  {
    key: 'disciplines',
    label: 'Dyscypliny',
    className: 'autocomplete__group-label--disciplines',
  },
  {
    key: 'other',
    label: 'Inne',
    className: 'autocomplete__group-label--other',
  },
]

export function GroupedSelect({
  value,
  onChange,
  groups,
  emptyLabel = '— dowolna —',
}: Props) {
  const autocompleteGroups: AutocompleteGroup[] = GROUP_META.map(
    ({ key, label, className }) => ({
      key,
      label,
      className,
      items: groups[key],
    }),
  )

  return (
    <AutocompleteSelect
      value={value}
      onChange={onChange}
      groups={autocompleteGroups}
      emptyLabel={emptyLabel}
      aria-label="Umiejętność lub dyscyplina"
    />
  )
}
