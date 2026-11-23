<script lang="ts">
  import type { Snippet } from "svelte";
  import FilmGrainToggle from "#lib/components/home/FilmGrainToggle.svelte";

  let { children }: { children: Snippet } = $props();
</script>

{@render children()}
<FilmGrainToggle placement="corner" />
