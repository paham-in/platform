//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'questionpackage_update_input.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class QuestionpackageUpdateInput {
  /// Returns a new [QuestionpackageUpdateInput] instance.
  QuestionpackageUpdateInput({

     this.collectionId,

     this.description,

     this.name,

     this.status,

     this.subjectId,
  });

  @JsonKey(
    
    name: r'collection_id',
    required: false,
    includeIfNull: false,
  )


  final int? collectionId;



  @JsonKey(
    
    name: r'description',
    required: false,
    includeIfNull: false,
  )


  final String? description;



  @JsonKey(
    
    name: r'name',
    required: false,
    includeIfNull: false,
  )


  final String? name;



  @JsonKey(
    
    name: r'status',
    required: false,
    includeIfNull: false,
  )


  final String? status;



  @JsonKey(
    
    name: r'subject_id',
    required: false,
    includeIfNull: false,
  )


  final int? subjectId;





    @override
    bool operator ==(Object other) => identical(this, other) || other is QuestionpackageUpdateInput &&
      other.collectionId == collectionId &&
      other.description == description &&
      other.name == name &&
      other.status == status &&
      other.subjectId == subjectId;

    @override
    int get hashCode =>
        collectionId.hashCode +
        description.hashCode +
        name.hashCode +
        status.hashCode +
        subjectId.hashCode;

  factory QuestionpackageUpdateInput.fromJson(Map<String, dynamic> json) => _$QuestionpackageUpdateInputFromJson(json);

  Map<String, dynamic> toJson() => _$QuestionpackageUpdateInputToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

