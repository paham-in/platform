import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pahamin_api/pahamin_api.dart';

import '../../core/api.dart';
import '../../shared/formatters.dart';
import '../../shared/widgets/async_view.dart';

final questionProvider =
    FutureProvider.autoDispose.family<ForumQuestionResponse, int>((ref, id) async =>
        (await ref.read(apiProvider).getForumApi().questionsIdGet(id: id)).data!);

final answersProvider =
    FutureProvider.autoDispose.family<List<AnswerAnswerResponse>, int>((ref, id) async =>
        (await ref.read(apiProvider).getForumApi().questionsQuestionIdAnswersGet(questionId: id)).data!);

class QuestionDetailScreen extends ConsumerStatefulWidget {
  const QuestionDetailScreen({super.key, required this.id});

  final int id;

  @override
  ConsumerState<QuestionDetailScreen> createState() => _QuestionDetailScreenState();
}

class _QuestionDetailScreenState extends ConsumerState<QuestionDetailScreen> {
  final _answerCtrl = TextEditingController();
  bool _sending = false;

  @override
  void dispose() {
    _answerCtrl.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final content = _answerCtrl.text.trim();
    if (content.isEmpty || _sending) return;
    setState(() => _sending = true);
    try {
      await unwrap(ref.read(apiProvider).getForumApi().questionsQuestionIdAnswersPost(
            questionId: widget.id,
            body: AnswerCreateAnswerInput(content: content),
          ));
      _answerCtrl.clear();
      ref.invalidate(answersProvider(widget.id));
      ref.invalidate(questionProvider(widget.id));
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final question = ref.watch(questionProvider(widget.id));
    final answers = ref.watch(answersProvider(widget.id));
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Pertanyaan')),
      body: Column(
        children: [
          Expanded(
            child: AsyncView(
              value: question,
              onRetry: () => ref.invalidate(questionProvider(widget.id)),
              builder: (q) => ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Row(
                    children: [
                      CircleAvatar(radius: 18, child: Text((q.userName ?? '?').characters.first)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(q.userName ?? '-', style: theme.textTheme.titleSmall),
                            Text('${q.subjectName ?? ''} • ${formatDateTime(q.createdAt)}',
                                style: theme.textTheme.bodySmall),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (q.subjectName != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Chip(label: Text('#${q.subjectName}'), visualDensity: VisualDensity.compact),
                    ),
                  const SizedBox(height: 8),
                  SelectableText(q.plainContent?.isNotEmpty == true ? q.plainContent! : stripHtml(q.content),
                      style: theme.textTheme.bodyMedium?.copyWith(height: 1.6)),
                  const SizedBox(height: 24),
                  Text('${q.answerCount ?? 0} Jawaban', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 8),
                  _Answers(answers: answers),
                ],
              ),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _answerCtrl,
                      minLines: 1,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        hintText: 'Tulis jawaban...',
                        isDense: true,
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: _sending ? null : _send,
                    icon: _sending
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.send),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Answers extends ConsumerWidget {
  const _Answers({required this.answers});

  final AsyncValue<List<AnswerAnswerResponse>> answers;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    return answers.when(
      data: (items) {
        if (items.isEmpty) return const Text('Belum ada jawaban. Jadilah yang pertama!');
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            for (final a in items)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            CircleAvatar(radius: 14, child: Text((a.userName ?? '?').characters.first)),
                            const SizedBox(width: 8),
                            Text(a.userName ?? '-', style: theme.textTheme.titleSmall),
                            const Spacer(),
                            Text(formatDateTime(a.createdAt), style: theme.textTheme.bodySmall),
                          ],
                        ),
                        const SizedBox(height: 8),
                        SelectableText(a.plainContent?.isNotEmpty == true ? a.plainContent! : stripHtml(a.content),
                            style: theme.textTheme.bodyMedium?.copyWith(height: 1.5)),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        );
      },
      loading: () => const Padding(
        padding: EdgeInsets.all(24),
        child: Center(child: CircularProgressIndicator()),
      ),
      error: (e, _) => Text('Gagal memuat jawaban: $e', style: theme.textTheme.bodySmall),
    );
  }
}