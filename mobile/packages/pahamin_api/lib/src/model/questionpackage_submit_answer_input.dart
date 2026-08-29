//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'questionpackage_submit_answer_input.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class QuestionpackageSubmitAnswerInput {
  /// Returns a new [QuestionpackageSubmitAnswerInput] instance.
  QuestionpackageSubmitAnswerInput({

     this.answerId,

     this.questionId,
  });

  @JsonKey(
    
    name: r'answer_id',
    required: false,
    includeIfNull: false,
  )


  final int? answerId;



  @JsonKey(
    
    name: r'question_id',
    required: false,
    includeIfNull: false,
  )


  final int? questionId;





    @override
    bool operator ==(Object other) => identical(this, other) || other is QuestionpackageSubmitAnswerInput &&
      other.answerId == answerId &&
      other.questionId == questionId;

    @override
    int get hashCode =>
        answerId.hashCode +
        questionId.hashCode;

  factory QuestionpackageSubmitAnswerInput.fromJson(Map<String, dynamic> json) => _$QuestionpackageSubmitAnswerInputFromJson(json);

  Map<String, dynamic> toJson() => _$QuestionpackageSubmitAnswerInputToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

