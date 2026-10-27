import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRoomInviteMessage } from '@/lib/multiplayer/invite';
import { pointsLabel, questionCountLabel, quizBadge, quizDisplayTitle } from '@/components/web2/samen/quiz-display';
import { cleanRoomCode, extractRoomCode } from '@/components/web2/samen/room-code';
import { routeForRoom, statusBelongsTo } from '@/components/web2/samen/routes';

test('quiz title gets its chapter in front, unless the title already names the book', () => {
  assert.equal(quizDisplayTitle('Brood voor 5000', 'Johannes 6'), 'Johannes 6 - Brood voor 5000');
  assert.equal(quizDisplayTitle('Handelingen 4', 'Handelingen 4'), 'Handelingen 4');
  assert.equal(quizDisplayTitle('Daniël deel 2', 'Daniel 2'), 'Daniël deel 2');
  assert.equal(quizDisplayTitle('Wie zei het?', null), 'Wie zei het?');
});

test('quiz badge is the first three letters of the book, or of the title', () => {
  assert.equal(quizBadge('Brood voor 5000', 'Johannes 6'), 'Joh');
  assert.equal(quizBadge('David en Goliat', '1 Samuël 17'), '1Sa');
  assert.equal(quizBadge('Vrouwen in de Bijbel', null), 'Vro');
  assert.equal(quizBadge('', null), '?');
});

test('counts read as Dutch', () => {
  assert.equal(questionCountLabel(1), '1 vraag');
  assert.equal(questionCountLabel(10), '10 vragen');
  assert.equal(pointsLabel(1), '1 punt');
  assert.equal(pointsLabel(9), '9 punten');
  assert.equal(pointsLabel(3, true), '3 pt');
});

test('a pasted invite message, link or code all fill the code boxes', () => {
  const message = buildRoomInviteMessage('K7PQ2M', 'Brood voor 5000', 'https://www.bijbelquiz.com');
  assert.equal(extractRoomCode(message), 'K7PQ2M');
  assert.equal(extractRoomCode('https://www.bijbelquiz.com/samen-spelen/k7pq2m/lobby?bron=uitnodiging'), 'K7PQ2M');
  assert.equal(extractRoomCode(' k7-pq 2m '), 'K7PQ2M');
  assert.equal(cleanRoomCode('ab c!1'), 'ABC1');
});

test('each room status has one screen', () => {
  assert.equal(routeForRoom('k7pq2m', 'lobby'), '/samen-spelen/K7PQ2M/lobby');
  assert.equal(routeForRoom('K7PQ2M', 'reading'), '/samen-spelen/K7PQ2M/spel');
  assert.equal(routeForRoom('K7PQ2M', 'in_progress'), '/samen-spelen/K7PQ2M/spel');
  assert.equal(routeForRoom('K7PQ2M', 'question_result'), '/samen-spelen/K7PQ2M/spel');
  assert.equal(routeForRoom('K7PQ2M', 'finished'), '/samen-spelen/K7PQ2M/uitslag');

  assert.equal(statusBelongsTo('lobby', 'lobby'), true);
  assert.equal(statusBelongsTo('lobby', 'in_progress'), false);
  assert.equal(statusBelongsTo('game', 'reading'), true);
  assert.equal(statusBelongsTo('game', 'question_result'), true);
  assert.equal(statusBelongsTo('game', 'finished'), false);
  assert.equal(statusBelongsTo('results', 'finished'), true);
});
