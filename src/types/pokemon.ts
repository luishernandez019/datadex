export interface PokemonListResult {
  name: string
  url: string
}

export interface PokemonListResponse {
  count: number
  next: string | null
  previous: string | null
  results: PokemonListResult[]
}

export interface PokemonType {
  slot: number
  type: { name: string; url: string }
}

export interface PokemonStat {
  base_stat: number
  effort: number
  stat: { name: string; url: string }
}

export interface PokemonAbility {
  ability: { name: string; url: string }
  is_hidden: boolean
  slot: number
}

export interface PokemonMove {
  move: { name: string; url: string }
  version_group_details: {
    level_learned_at: number
    move_learn_method: { name: string; url: string }
    version_group: { name: string; url: string }
  }[]
}

export interface PokemonSprites {
  front_default: string | null
  front_shiny: string | null
  back_default: string | null
  other: {
    'official-artwork': {
      front_default: string | null
      front_shiny: string | null
    }
    home: {
      front_default: string | null
      front_shiny: string | null
    }
    showdown?: {
      front_default: string | null
      back_default: string | null
    }
  }
}

export interface Pokemon {
  id: number
  name: string
  base_experience: number
  height: number
  weight: number
  types: PokemonType[]
  stats: PokemonStat[]
  abilities: PokemonAbility[]
  moves: PokemonMove[]
  sprites: PokemonSprites
  species: { name: string; url: string }
}

export interface FlavorTextEntry {
  flavor_text: string
  language: { name: string }
  version: { name: string }
}

export interface PokemonSpecies {
  id: number
  name: string
  flavor_text_entries: FlavorTextEntry[]
  evolution_chain: { url: string }
  genera: { genus: string; language: { name: string } }[]
  generation: { name: string; url: string }
  is_legendary: boolean
  is_mythical: boolean
  is_baby: boolean
  color: { name: string }
  habitat: { name: string } | null
  egg_groups: { name: string }[]
  growth_rate: { name: string }
  base_happiness: number
  capture_rate: number
}

export interface EvolutionDetail {
  item: { name: string } | null
  min_level: number | null
  min_happiness: number | null
  min_beauty: number | null
  min_affection: number | null
  trigger: { name: string }
  held_item: { name: string } | null
  known_move: { name: string } | null
  known_move_type: { name: string } | null
  location: { name: string } | null
  needs_overworld_rain: boolean
  party_species: null
  party_type: null
  relative_physical_stats: number | null
  time_of_day: string
  trade_species: null
  turn_upside_down: boolean
}

export interface ChainLink {
  is_baby: boolean
  species: { name: string; url: string }
  evolution_details: EvolutionDetail[]
  evolves_to: ChainLink[]
}

export interface EvolutionChainData {
  id: number
  chain: ChainLink
}

export interface MoveDetail {
  id: number
  name: string
  names: { name: string; language: { name: string } }[]
  type: { name: string }
  damage_class: { name: string }
  power: number | null
  accuracy: number | null
  pp: number | null
}

export type SortField = 'id' | 'name' | 'type' | 'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed' | 'total'
export type SortOrder = 'asc' | 'desc'

export const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC',
}

export const STAT_COLORS: Record<string, string> = {
  hp: '#FF5959',
  attack: '#F5AC78',
  defense: '#FAE078',
  'special-attack': '#9DB7F5',
  'special-defense': '#A7DB8D',
  speed: '#FA92B2',
}

export const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'ATK',
  defense: 'DEF',
  'special-attack': 'SP.ATK',
  'special-defense': 'SP.DEF',
  speed: 'SPD',
}
