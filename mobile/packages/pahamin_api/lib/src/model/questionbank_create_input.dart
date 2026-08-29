//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:pahamin_api/src/model/questionbank_quiz_answer_input.dart';
import 'package:json_annotation/json_annotation.dart';

part 'questionbank_create_input.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class QuestionbankCreateInput {
  /// Returns a new [QuestionbankCreateInput] instance.
  QuestionbankCreateInput({

     this.answers,

     this.explanation,

     this.question,

     this.userId,
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



  @JsonKey(
    
    name: r'user_id',
    required: false,
    includeIfNull: false,
  )


  final int? userId;





    @override
    bool operator ==(Object other) => identical(this, other) || other is QuestionbankCreateInput &&
      other.answers == answers &&
      other.explanation == explanation &&
      other.question == question &&
      other.userId == userId;

    @override
    int get hashCode =>
        answers.hashCode +
        explanation.hashCode +
        question.hashCode +
        userId.hashCode;

  factory QuestionbankCreateInput.fromJson(Map<String, dynamic> json) => _$QuestionbankCreateInputFromJson(json);

  Map<String, dynamic> toJson() => _$QuestionbankCreateInputToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

