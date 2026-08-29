//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'forum_create_question_input.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class ForumCreateQuestionInput {
  /// Returns a new [ForumCreateQuestionInput] instance.
  ForumCreateQuestionInput({

     this.content,

     this.subjectId,
  });

  @JsonKey(
    
    name: r'content',
    required: false,
    includeIfNull: false,
  )


  final String? content;



      /// wajib — pertanyaan harus masuk ke mata pelajaran
  @JsonKey(
    
    name: r'subject_id',
    required: false,
    includeIfNull: false,
  )


  final int? subjectId;





    @override
    bool operator ==(Object other) => identical(this, other) || other is ForumCreateQuestionInput &&
      other.content == content &&
      other.subjectId == subjectId;

    @override
    int get hashCode =>
        content.hashCode +
        subjectId.hashCode;

  factory ForumCreateQuestionInput.fromJson(Map<String, dynamic> json) => _$ForumCreateQuestionInputFromJson(json);

  Map<String, dynamic> toJson() => _$ForumCreateQuestionInputToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

