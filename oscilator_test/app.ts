window.onclick = () =>
{
	const audioContext = new AudioContext();
	const baseNote = Note.Base.Transpose(-5, 0);
	const fmNote = baseNote.Transpose(0, 2);
	const oscilator = audioContext.createOscillator();
	const volume = audioContext.createGain();
	let fmDepth = 300;

	oscilator.frequency.setValueAtTime(baseNote.Frequency, audioContext.currentTime);
	oscilator.type = "sine";

	function fmWarp(t: number, depth: number, frequency: number)
	{
		return baseNote.Frequency + Math.sin(t * frequency * Math.PI) * depth;
	}

	const fm = [];
	const duration = 10;

	for (let t = 0; t < duration; t += 1 / audioContext.sampleRate)
	{
		fm.push(fmWarp(t, fmDepth, fmNote.Frequency));
	}

	oscilator.frequency.setValueCurveAtTime(fm, audioContext.currentTime, duration);

	const gain = [];
	const gainDuration = 0.5;
	const decreaseRate = 0.001;

	for (let t = 0; t < gainDuration; t += 1 / audioContext.sampleRate)
	{
		gain.push((Math.pow(decreaseRate, t / gainDuration) - decreaseRate) * (1 + decreaseRate));
	}

	volume.gain.value
	volume.gain.setValueCurveAtTime(gain, audioContext.currentTime, gainDuration);

	oscilator.connect(volume);
	volume.connect(audioContext.destination);
	oscilator.start();
}

enum KeysScale
{
	"A" = 0,
	"A#" = 1,
	"B" = 2,
	"C" = 3,
	"C#" = 4,
	"D" = 5,
	"D#" = 6,
	"E" = 7,
	"F" = 8,
	"F#" = 9,
	"G" = 10,
	"G#" = 11
}

class Settings
{
	public static get OctaveLength(): number
	{
		return 12;
	}
}

class Note
{
	private _key: KeysScale;
	private _octave: number;
	private _frequency: number;

	public static Base = new Note(KeysScale.A, 0, 55);

	public get Key()
	{
		return this._key;
	}
	public get Octave()
	{
		return this._octave;
	}
	public get Frequency()
	{
		return this._frequency;
	}

	public Transpose(keys: number, octaves: number)
	{
		const key = (keys + this.Key) % Settings.OctaveLength as KeysScale;
		const octave = (octaves + this.Octave);
		const transposeLength = keys + octaves * Settings.OctaveLength;
		const frequency = this.Frequency * Math.pow(2, transposeLength / 12);

		return new Note(key, octave, frequency);
	}

	private constructor(key: KeysScale, octave: number, frequency: number)
	{
		this._key = key;
		this._octave = octave;
		this._frequency = frequency;
	}
}