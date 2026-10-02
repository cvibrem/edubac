<script lang="ts">
	import { page } from '$app/state';
	import { goBack } from '$lib/utils/back';
	import { asResolved } from '$lib/utils/resolvePath';
</script>

<h1>Detail {page.params.id}</h1>
<button type="button" onclick={() => goBack(asResolved('/home'))}>← Back</button>