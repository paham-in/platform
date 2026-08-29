//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'questionpackage_package_question_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class QuestionpackagePackageQuestionResponse {
  /// Returns a new [QuestionpackagePackageQuestionResponse] instance.
  QuestionpackagePackageQuestionResponse({

     this.id,

     this.question,
  });

  @JsonKey(
    
    name: r'id',
    required: false,
    includeIfNull: false,
  )


  final int? id;



  @JsonKey(
    
    name: r'question',
    required: false,
    includeIfNull: false,
  )


  final String? question;





    @override
    bool operator ==(Object other) => identical(this, other) || other is QuestionpackagePackageQuestionResponse &&
      other.id == id &&
      other.question == question;

    @override
    int get hashCode =>
        id.hashCode +
        question.hashCode;

  factory QuestionpackagePackageQuestionResponse.fromJson(Map<String, dynamic> json) => _$QuestionpackagePackageQuestionResponseFromJson(json);

  Map<String, dynamic> toJson() => _$QuestionpackagePackageQuestionResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

