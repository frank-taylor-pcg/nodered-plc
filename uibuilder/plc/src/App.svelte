<div class='wrapper'>
	<div class='region deck-wrapper'>
		{#each state.Deck_Scan_Results || [] as container}
			<input
				class='element'
				type='text'
				bind:value={container}
				on:blur={() => addContainer(container)}
			/>
		{/each}
	</div>
	
	<div class='region column'>
		{#each state.Tray_Scan_Results || [] as tray}
				<input
					class='element'
					type='text'
					bind:value={tray}
					on:blur={() => addContainer(tray)}
				>
		{/each}
	</div>
	
	<div class='region column'>
		<button on:click={reset}>Reset state</button>
		<button on:click={clear}>Clear log</button>
		<button on:click={review}>Review state</button>
		<button on:click={save}>Save state</button>
		<textarea id='logs' class='log' placeholder='Log messages...' readonly>{logs}</textarea>
	</div>
	
	<div class='region column'>
		<div class='header'>Tray_Scan</div>
			<div class='row'>
				<div id='Tray_Scan.Request' class='subheader'>Request</div>
				<div id='Tray_Scan.Complete' class='subheader'>Complete</div>
				<div id='Tray_Scan.Acknowledge' class='subheader'>Acknowledge</div>
			</div>
		
			<div class='row'>
				<div class='value'>{state.Tray_Scan.Request}</div>
				<div class='value'>{state.Tray_Scan.Complete}</div>
				<div class='value'>{state.Tray_Scan.Acknowledge}</div>
			</div>
		
		<div class='header'>Deck_Scan</div>
			<div class='row'>
				<div class='subheader'>Request</div>
				<div class='subheader'>Complete</div>
				<div class='subheader'>Acknowledge</div>
			</div>
		
			<div class='row'>
				<div class='value'>{state.Deck_Scan.Request}</div>
				<div class='value'>{state.Deck_Scan.Complete}</div>
				<div class='value'>{state.Deck_Scan.Acknowledge}</div>
			</div>

		<!-- Load_Tray Request -->
		<div class='header'>Load_Tray</div>
			<div class='row'>
				<div class='subheader'>Load_Slot</div>
				<div class='subheader'>Request</div>
				<div class='subheader'>Complete</div>
				<div class='subheader'>Acknowledge</div>
			</div>
		
			<div class='row'>
				<div class='value'>{state.Load_Tray.Load_Slot}</div>
				<div class='value'>{state.Load_Tray.Request}</div>
				<div class='value'>{state.Load_Tray.Complete}</div>
				<div class='value'>{state.Load_Tray.Acknowledge}</div>
			</div>

			<!-- Pick_Front Request -->
		<div class='header'>Pick_Front</div>
			<div class='row'>
				<div class='subheader'>Tray_Area</div>
				<div class='subheader'>Active_Nozzle</div>
				<div class='subheader'>Request</div>
				<div class='subheader'>Complete</div>
				<div class='subheader'>Acknowledge</div>
			</div>
		
			<div class='row'>
				<div class='value'>{state.Pick_Front.Tray_Area}</div>
				<div class='value'>{state.Pick_Front.Active_Nozzle}</div>
				<div class='value'>{state.Pick_Front.Request}</div>
				<div class='value'>{state.Pick_Front.Complete}</div>
				<div class='value'>{state.Pick_Front.Acknowledge}</div>
			</div>
		
		<div class='header'>Pick_Rear</div>
			<div class='row'>
				<div class='subheader'>Tray_Area</div>
				<div class='subheader'>Active_Nozzle</div>
				<div class='subheader'>Request</div>
				<div class='subheader'>Complete</div>
				<div class='subheader'>Acknowledge</div>
			</div>
		
			<div class='row'>
				<div class='value'>{state.Pick_Rear.Tray_Area}</div>
				<div class='value'>{state.Pick_Rear.Active_Nozzle}</div>
				<div class='value'>{state.Pick_Rear.Request}</div>
				<div class='value'>{state.Pick_Rear.Complete}</div>
				<div class='value'>{state.Pick_Rear.Acknowledge}</div>
			</div>
		
		<div class='header'>Drop_Front</div>
			<div class='row'>
				<div class='subheader'>Destination</div>
				<div class='subheader'>Active_Nozzle</div>
				<div class='subheader'>Request</div>
				<div class='subheader'>Complete</div>
				<div class='subheader'>Acknowledge</div>
			</div>
		
			<div class='row'>
				<div class='value'>{state.Drop_Front.Destination}</div>
				<div class='value'>{state.Drop_Front.Active_Nozzle}</div>
				<div class='value'>{state.Drop_Front.Request}</div>
				<div class='value'>{state.Drop_Front.Complete}</div>
				<div class='value'>{state.Drop_Front.Acknowledge}</div>
			</div>
		
		<div class='header'>Drop_Rear</div>
			<div class='row'>
				<div class='subheader'>Destination</div>
				<div class='subheader'>Active_Nozzle</div>
				<div class='subheader'>Request</div>
				<div class='subheader'>Complete</div>
				<div class='subheader'>Acknowledge</div>
			</div>
		
			<div class='row'>
				<div class='value'>{state.Drop_Rear.Destination}</div>
				<div class='value'>{state.Drop_Rear.Active_Nozzle}</div>
				<div class='value'>{state.Drop_Rear.Request}</div>
				<div class='value'>{state.Drop_Rear.Complete}</div>
				<div class='value'>{state.Drop_Rear.Acknowledge}</div>
			</div>
		
	</div>
</div>

<style>
	.wrapper {
		display: grid;
		grid-template-columns: 4fr 1fr 1fr;
		grid-template-rows: 1fr 3fr;
		width: 1800px;
		height: 980px;
		grid-auto-flow: row;
	}

	.region {
		margin: 2px;
		padding: 2px 6px;
		border: solid 1px #00bc8c;
		border-radius: 6px;
		text-align: center;
	}

	.column {
		grid-row: span 2;
	}

	.row {
		display: inline;
	}

	.deck-wrapper {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		grid-template-rows: repeat(8, 1fr)
	}

	.element {
		margin: 5px 1px;
		padding: 1px 4px;
		border: solid 1px #f39c12;
		border-radius: 6px;
		text-align: center;
		height: 24px;
		width: 95%;
	}

	.header {
		background: #375a7f;
		color: #fff;
		margin: 10px;
		border-radius: 6px;
	}

	.row {
		display: flex;
	}
	
	.subheader {
		color: #fff;
		flex: 1
	}
	
	.value {
		color: #00bc8d;
		flex: 1
	}

	button {
		background: #375a7f;
		margin: 5px;
		height: 28px;
		border: 0px;
		border-radius: 6px;
		vertical-align: middle;
		padding: 4px 8px;
	}

	button:hover {
		background: #2f4d6c;
	}

	.log {
		height: 90%;
		width: 95%;
		border: 1px solid #ccc;
		border-radius: 8px;
		padding: 6px;
	}
</style>

<script>
	class State {
		constructor(containers, trays) {
			this.Deck_Scan = {
				Request: false,
				Complete: false,
				Acknowledge: false
			};

			this.Deck_Scan_Results = createContainers();
			
			this.Tray_Scan = {
				Request: false,
				Complete: false,
				Acknowledge: false
			};

			this.Tray_Scan_Results = createTrays();
			
			this.Load_Tray = {
				Load_Slot: -1,
				Request: false,
				Complete: false,
				Acknowledge: false
			};
			
			this.Pick_Front = {
				Tray_Area: -1,
				Active_Nozzle: 0,
				Request: false,
				Complete: false,
				Acknowledge: false
			};
			
			this.Pick_Rear = {
				Tray_Area: -1,
				Active_Nozzle: 0,
				Request: false,
				Complete: false,
				Acknowledge: false
			};
			
			this.Drop_Front = {
				Destination: -1,
				Active_Nozzle: 0,
				Request: false,
				Complete: false,
				Acknowledge: false
			};
			
			this.Drop_Rear = {
				Destination: -1,
				Active_Nozzle: 0,
				Request: false,
				Complete: false,
				Acknowledge: false
			};
		}

		toString() {
			return JSON.stringify(this, null, ' ');
		}
	}

	function createContainers() {
		return Array.from({ length: 32 }, (_, i) => '');
	}

	function createTrays() {
		return Array.from({ length: 25 }, (_, i) => '');
	}

	function addLogMessage(msg) {
		logs += `${msg}\n`;
	}

	function clear() {
		logs = "";
	}
	
	function reset() {
		state = new State();
		addLogMessage('Reset state');

		containers = createContainers();
		addLogMessage('Reset loaded containers');
		
		trays = createTrays();
		addLogMessage('Reset loaded trays');
	}
	
	function review() {
		// addLogMessage(state);
		addLogMessage("Loaded containers:");
		containers.forEach(x => {
			if (x?.trim() != '') {
				addLogMessage(x);
			}
		});
		addLogMessage('Done listing containers...')
		addLogMessage("Loaded trays:");
		trays.forEach(x => {
			if (x?.trim() != '') {
				addLogMessage(x);
			}
		});
		addLogMessage('Done listing trays...')
	}

	function save() {
		uibuilder.send({
			'topic': 'stateChanged',
			'payload': state
		});		
	}

	uibuilder.onChange('msg', (msg) => {
		if (!msg.payload) return;
		state = msg.payload;
	});

	function addContainer(barcode) {
		if (barcode?.trim() == '') return;

		save();
		
		addLogMessage(`Added ${barcode}`);
	}

	let containers = createContainers();
	let trays = createTrays();
	let state = new State(containers, trays);
	let logs = '';

</script>