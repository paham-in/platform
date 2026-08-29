//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'questionbank_quiz_answer_input.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class QuestionbankQuizAnswerInput {
  /// Returns a new [QuestionbankQuizAnswerInput] instance.
  QuestionbankQuizAnswerInput({

     this.content,

     this.isCorrect,
  });

  @JsonKey(
    
    name: r'content',
    required: false,
    includeIfNull: false,
  )


  final String? content;



  @JsonKey(
    
    name: r'is_correct',
    required: false,
    includeIfNull: false,
  )


  final bool? isCorrect;





    @override
    bool operator ==(Object other) => identical(this, other) || other is QuestionbankQuizAnswerInput &&
      other.content == content &&
      other.isCorrect == isCorrect;

    @override
    int get hashCode =>
        content.hashCode +
        isCorrect.hashCode;

  factory QuestionbankQuizAnswerInput.fromJson(Map<String, dynamic> json) => _$QuestionbankQuizAnswerInputFromJson(json);

  Map<String, dynamic> toJson() => _$QuestionbankQuizAnswerInputToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

