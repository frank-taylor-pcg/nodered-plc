<script>
	export let type = 'Container';
	export let id = 'A';
	export let value;
</script>

<div>
	<label for="{type}_{id}">{type} {id}</label>
	<input type='text' id="{type}_{id}" {value} />
</div>

<style>
	label {
		width: 100px;
	}

	input {
		width: 100px;
	}
</style>