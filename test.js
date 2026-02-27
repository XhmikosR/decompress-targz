import fs, {promises as fsP} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'ava';
import {fileTypeFromBuffer} from 'file-type';
import decompressTarGz from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function isJpg(input) {
	const fileType = await fileTypeFromBuffer(input);
	return fileType?.mime === 'image/jpeg';
}

test('extract file', async t => {
	const buf = await fsP.readFile(path.join(__dirname, 'fixtures', 'file.tar.gz'));
	const files = await decompressTarGz()(buf);

	t.is(files[0].path, 'test.jpg');
	t.true(await isJpg(files[0].data));
});

test('extract file using streams', async t => {
	const stream = fs.createReadStream(path.join(__dirname, 'fixtures', 'file.tar.gz'));
	const files = await decompressTarGz()(stream);

	t.is(files[0].path, 'test.jpg');
	t.true(await isJpg(files[0].data));
});

test('return empty array if non-valid file is supplied', async t => {
	const buf = await fsP.readFile(__filename);
	const files = await decompressTarGz()(buf);

	t.is(files.length, 0);
});

test('throw on wrong input', async t => {
	await t.throwsAsync(decompressTarGz()('foo'), undefined, 'Expected a Buffer or Stream, got string');
});

test('handle gzip error', async t => {
	const buf = await fsP.readFile(path.join(__dirname, 'fixtures', 'fail.tar.gz'));
	const error = await t.throwsAsync(decompressTarGz()(buf), undefined, 'unexpected end of file');
	t.is(error.code, 'Z_BUF_ERROR');
});
