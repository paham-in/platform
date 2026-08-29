import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pahamin_api/pahamin_api.dart';

import '../../core/api.dart';
import '../../shared/widgets/async_view.dart';
import 'forum_list_screen.dart' show allSubjectsProvider;

class AskQuestionScreen extends ConsumerStatefulWidget {
  const AskQuestionScreen({super.key});

  @override
  ConsumerState<AskQuestionScreen> createState() => _AskQuestionScreenState();
}

class _AskQuestionScreenState extends ConsumerState<AskQuestionScreen> {
  final _contentCtrl = TextEditingController();
  int? _subjectId;
  bool _sending = false;

  @override
  void dispose() {
    _contentCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final content = _contentCtrl.text.trim();
    if (content.isEmpty || _subjectId == null || _sending) {
      showToast(context, 'Pilih mata pelajaran dan tulis pertanyaan.');
      return;
    }
    setState(() => _sending = true);
    try {
      await unwrap(ref.read(apiProvider).getForumApi().questionsPost(
            body: ForumCreateQuestionInput(subjectId: _subjectId, content: content),
          ));
      if (mounted) {
        showToast(context, 'Pertanyaan terkirim.');
        context.pop();
      }
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final subjects = ref.watch(allSubjectsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Tanya')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          AsyncView(
            value: subjects,
            builder: (items) => Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Mata Pelajaran'),
                const SizedBox(height: 8),
                DropdownButtonFormField<int>(
                  initialValue: _subjectId,
                  decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true),
                  hint: const Text('Pilih mapel'),
                  items: [
                    for (final s in items) DropdownMenuItem(value: s.id, child: Text(s.name ?? '-')),
                  ],
                  onChanged: (v) => setState(() => _subjectId = v),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const Text('Pertanyaan'),
          const SizedBox(height: 8),
          TextField(
            controller: _contentCtrl,
            minLines: 5,
            maxLines: 12,
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              hintText: 'Jelaskan pertanyaanmu dengan jelas...',
            ),
          ),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: _sending ? null : _submit,
            icon: _sending
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.send),
            label: Text(_sending ? 'Mengirim...' : 'Kirim Pertanyaan'),
          ),
        ],
      ),
    );
  }
}