//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:pahamin_api/src/model/questionbank_quiz_answer_input.dart';
import 'package:json_annotation/json_annotation.dart';

part 'questionbank_update_input.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class QuestionbankUpdateInput {
  /// Returns a new [QuestionbankUpdateInput] instance.
  QuestionbankUpdateInput({

     this.answers,

     this.explanation,

     this.question,
  });

  @JsonKey(
    
    name: r'answers',
    required: false,
    includeIfNull: false,
  )


  final List<QuestionbankQuizAnswerInput>? answers;



  @JsonKey(
    
    name: r'explanation',
    required: false,
    includeIfNull: false,
  )


  final String? explanation;



  @JsonKey(
    
    name: r'question',
    required: false,
    includeIfNull: false,
  )


  final String? question;





    @override
    bool operator ==(Object other) => identical(this, other) || other is QuestionbankUpdateInput &&
      other.answers == answers &&
      other.explanation == explanation &&
      other.question == question;

    @override
    int get hashCode =>
        answers.hashCode +
        explanation.hashCode +
        question.hashCode;

  factory QuestionbankUpdateInput.fromJson(Map<String, dynamic> json) => _$QuestionbankUpdateInputFromJson(json);

  Map<String, dynamic> toJson() => _$QuestionbankUpdateInputToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

