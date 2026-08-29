//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'questionbank_answer_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class QuestionbankAnswerResponse {
  /// Returns a new [QuestionbankAnswerResponse] instance.
  QuestionbankAnswerResponse({

     this.content,

     this.id,

     this.isCorrect,
  });

  @JsonKey(
    
    name: r'content',
    required: false,
    includeIfNull: false,
  )


  final String? content;



  @JsonKey(
    
    name: r'id',
    required: false,
    includeIfNull: false,
  )


  final int? id;



  @JsonKey(
    
    name: r'is_correct',
    required: false,
    includeIfNull: false,
  )


  final bool? isCorrect;





    @override
    bool operator ==(Object other) => identical(this, other) || other is QuestionbankAnswerResponse &&
      other.content == content &&
      other.id == id &&
      other.isCorrect == isCorrect;

    @override
    int get hashCode =>
        content.hashCode +
        id.hashCode +
        isCorrect.hashCode;

  factory QuestionbankAnswerResponse.fromJson(Map<String, dynamic> json) => _$QuestionbankAnswerResponseFromJson(json);

  Map<String, dynamic> toJson() => _$QuestionbankAnswerResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

