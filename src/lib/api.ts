import axios from 'axios'
import type {
  Pokemon,
  PokemonListResponse,
  PokemonSpecies,
  EvolutionChainData,
  MoveDetail,
} from '@/types/pokemon'

export const pokeApi = axios.create({
  baseURL: 'https://pokeapi.co/api/v2',
  timeout: 15000,
})

export const fetchPokemonList = async (limit = 1302, offset = 0): Promise<PokemonListResponse> => {
  const { data } = await pokeApi.get<PokemonListResponse>(`/pokemon?limit=${limit}&offset=${offset}`)
  return data
}

export const fetchPokemon = async (idOrName: string | number): Promise<Pokemon> => {
  const { data } = await pokeApi.get<Pokemon>(`/pokemon/${idOrName}`)
  return data
}

export const fetchPokemonSpecies = async (idOrName: string | number): Promise<PokemonSpecies> => {
  const { data } = await pokeApi.get<PokemonSpecies>(`/pokemon-species/${idOrName}`)
  return data
}

export const fetchEvolutionChain = async (id: string | number): Promise<EvolutionChainData> => {
  const { data } = await pokeApi.get<EvolutionChainData>(`/evolution-chain/${id}`)
  return data
}

export const fetchMoveDetail = async (idOrName: string | number): Promise<MoveDetail> => {
  const { data } = await pokeApi.get<MoveDetail>(`/move/${idOrName}`)
  return data
}

export interface AbilityData {
  id: number
  name: string
  names: { name: string; language: { name: string } }[]
  effect_entries: {
    effect: string
    short_effect: string
    language: { name: string }
  }[]
  flavor_text_entries: {
    flavor_text: string
    language: { name: string }
    version_group: { name: string }
  }[]
}

export const fetchAbility = async (nameOrId: string | number): Promise<AbilityData> => {
  const { data } = await pokeApi.get<AbilityData>(`/ability/${nameOrId}`)
  return data
}

export const getPokemonIdFromUrl = (url: string): number => {
  const parts = url.split('/').filter(Boolean)
  return parseInt(parts[parts.length - 1])
}

export const getEvolutionChainIdFromUrl = (url: string): number => {
  const parts = url.split('/').filter(Boolean)
  return parseInt(parts[parts.length - 1])
}

export const getSpriteUrl = (id: number): string =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`

export const getOfficialArtworkUrl = (id: number): string =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`

export const getShinyArtworkUrl = (id: number): string =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`
